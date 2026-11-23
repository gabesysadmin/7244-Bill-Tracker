import {
    db,
    messaging
} from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

let currentUser = null;
let currentBills = [];
let activeStatusFilter = "all";
let activePersonFilter = "all";
let showingArchived = false;

const form = document.getElementById("billForm");
const billList = document.getElementById("billList");
const assignedTo = document.getElementById("assignedTo");

const loginBtn = document.getElementById("loginBtn");
const statusFilter =
    document.getElementById("statusFilter");

const personFilter =
    document.getElementById("personFilter");
const toggleArchivedBtn =
    document.getElementById("toggleArchivedBtn");
const enableNotificationsBtn =
    document.getElementById(
        "enableNotificationsBtn"
    );

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            await login();

        }
    );
}
if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        () => {

            activeStatusFilter =
                statusFilter.value;

            loadBills();
        }
    );
}

if (personFilter) {

    personFilter.addEventListener(
        "change",
        () => {

            activePersonFilter =
                personFilter.value;

            loadBills();
        }
    );
}
if (toggleArchivedBtn) {

    toggleArchivedBtn.addEventListener(
        "click",
        () => {

            showingArchived =
                !showingArchived;

            toggleArchivedBtn.textContent =
                showingArchived
                    ? "Show Active"
                    : "Show Archived";

            loadBills();
        }
    );
}

if (enableNotificationsBtn) {

    enableNotificationsBtn
        .addEventListener(
            "click",
            enableNotifications
        );
}

async function enableNotifications() {

    try {

        const permission =
            await Notification.requestPermission();

        if (
            permission !== "granted"
        ) {

            alert(
                "Notification permission denied."
            );

            return;
        }

        const registration =
    await navigator.serviceWorker.register(
    "/7244-Bill-Tracker/firebase-messaging-sw.js"
);

await navigator.serviceWorker.ready;

const token =
    await getToken(
        messaging,
        {
            vapidKey:
                "BLvLnNDzFXIRUgNg5Fb3xhzImxyBur_99fP68OujA4Y_eUl14UCuKx1ThUlGSxZsWC5x_hLxnrhlJdhibIRpJLI",

            serviceWorkerRegistration:
                registration
        }
    );

        if (!token) {

            alert(
                "Could not get notification token."
            );

            return;
        }

        const usersSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "users"
                    ),
                    where(
                        "username",
                        "==",
                        currentUser.username
                    )
                )
            );

        for (
            const userDoc
            of usersSnapshot.docs
        ) {

            await updateDoc(
                doc(
                    db,
                    "users",
                    userDoc.id
                ),
                {
                    notificationsEnabled:
                        true,

                    fcmToken:
                        token
                }
            );
        }

        alert(
            "Notifications Enabled"
        );

    } catch (error) {

    console.error(error);

    alert(
        "Failed: " + error.message
    );

}
}

async function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const q = query(
        collection(db, "users"),
        where("username", "==", username),
        where("password", "==", password)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

        alert("Invalid username or password");

        return;
    }

    let userDocId = null;

snapshot.forEach((userDoc) => {
    userDocId = userDoc.id;

    currentUser = {
        ...userDoc.data(),
        previousLogin: userDoc.data().lastLogin || null
    };
});

await updateDoc(
    doc(db, "users", userDocId),
    {
        lastLogin: serverTimestamp()
    }
);
    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );

    showApp();

    loadUsers();
}

function logout() {

    localStorage.removeItem("currentUser");

    currentUser = null;

    document.getElementById("loginSection").style.display =
        "block";

    document.getElementById("appSection").style.display =
        "none";
}

window.logout = logout;

function showApp() {

    document.getElementById("loginSection").style.display =
        "none";

    document.getElementById("appSection").style.display =
        "block";

    if (currentUser.role !== "admin") {
    form.style.display = "none";

    if (personFilter) {
        personFilter.style.display = "none";
    }
} else {
    form.style.display = "block";

    if (personFilter) {
        personFilter.style.display = "inline-block";
    }
}

    const adminTabs =
    document.getElementById("adminTabs");

if (adminTabs) {

    if (currentUser.role !== "admin") {
        adminTabs.style.display = "none";
    } else {
        adminTabs.style.display = "flex";
    }

}

    const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage) {
    welcomeMessage.innerText =
        `Welcome, ${currentUser.displayname}`;
}

const lastLoginInfo =
    document.getElementById("lastLoginInfo");

if (lastLoginInfo) {

    if (currentUser.previousLogin) {

        let loginDate;

        if (
            typeof currentUser.previousLogin.seconds === "number"
        ) {
            loginDate = new Date(
                currentUser.previousLogin.seconds * 1000
            );
        } else {
            loginDate = new Date(
                currentUser.previousLogin
            );
        }

        lastLoginInfo.innerText =
            `Last login: ${loginDate.toLocaleString()}`;

    } else {

        lastLoginInfo.innerText =
            "First login";

    }
}
    loadBills();
    setupTabs();

const addBillSection =
    document.getElementById("addBillSection");

if (addBillSection) {
    addBillSection.style.display = "none";
}
}

async function loadUsers() {

    if (!assignedTo) {
        return;
    }

    assignedTo.innerHTML = `
        <option value="">
            Select Family Member
        </option>
    `;

    const snapshot =
        await getDocs(
            collection(db, "users")
        );

    snapshot.forEach((userDoc) => {

        const user = userDoc.data();
        console.log(user.displayname, user);

        if (user.role === "admin") {
            return;
        }

        assignedTo.innerHTML += `
            <option value="${user.username}">
                ${user.displayname}
            </option>
        `;
    });
    if (personFilter) {

    personFilter.innerHTML =
        `<option value="all">
            All Family Members
         </option>`;

    snapshot.forEach((userDoc) => {

        const user = userDoc.data();

        if (user.role === "admin") {
            return;
        }

        personFilter.innerHTML += `
            <option value="${user.username}">
                ${user.displayname}
            </option>
        `;
    });
}

}

async function loadUserActivity() {

    const tbody =
        document.getElementById("activityTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const snapshot =
        await getDocs(collection(db, "users"));

    snapshot.forEach((userDoc) => {

        const user = userDoc.data();

        let lastLogin = "Never";
        let daysAgo = "-";

        if (user.lastLogin) {

            const loginDate =
                user.lastLogin.toDate();

            lastLogin =
                loginDate.toLocaleString();

            daysAgo = Math.floor(
                (Date.now() - loginDate.getTime()) /
                86400000
            );
        }

        let lastReminder = "Never";

if (user.lastReminderSent) {
    lastReminder =
        user.lastReminderSent
            .toDate()
            .toLocaleString();
}

        tbody.innerHTML += `
    <tr>
        <td>${user.displayname}</td>
        <td>${lastLogin}</td>
        <td>${daysAgo}</td>
        <td>
    ${
        user.notificationsEnabled
            ? "✅ Enabled"
            : "❌ Disabled"
    }
</td>
<td>${lastReminder}</td>
    </tr>
`;
    });
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const selectedUser =
        assignedTo.options[
            assignedTo.selectedIndex
        ];

    const data = {

        assignedTo:
            assignedTo.value,

        displayname:
            selectedUser.text,

        billName:
            document.getElementById("billName").value,

        amount:
            Number(
                document.getElementById("amount").value
            ),

        dueDate:
    document.getElementById("dueDate").value,

notes:
    document.getElementById("notes").value,

recurring:
            document.getElementById("recurring").checked,

        status: "Due",
        archived: false

    };

    await addDoc(
        collection(db, "bills"),
        data
    );

    form.reset();

    loadBills();
});

async function markPaid(id) {

    const bill = currentBills.find(
        b => b.id === id
    );

    const billRef =
        doc(db, "bills", id);

    await updateDoc(
        billRef,
        {
            status: "Paid",
            paidDate:
                new Date().toISOString()
        }
    );

    if (
        bill &&
        bill.recurring === true
    ) {

        const nextDate =
            new Date(bill.dueDate);

        nextDate.setMonth(
            nextDate.getMonth() + 1
        );

        await addDoc(
            collection(db, "bills"),
            {
                assignedTo:
                    bill.assignedTo,

                displayname:
                    bill.displayname,

                billName:
    bill.billName,

notes:
    bill.notes || "",

amount:
                    bill.amount,

                dueDate:
                    nextDate
                        .toISOString()
                        .split("T")[0],

                recurring: true,

                status: "Due",
                archived: false
                
            }
        );
    }

    loadBills();
}

window.markPaid = markPaid;

async function deleteBill(id) {

    if (!confirm("Delete this bill?")) {
        return;
    }

    await deleteDoc(
        doc(db, "bills", id)
    );

    loadBills();
}

window.deleteBill = deleteBill;

async function archiveBill(id) {

    await updateDoc(
        doc(db, "bills", id),
        {
            archived: true
        }
    );

    loadBills();
}

window.archiveBill = archiveBill;

function editBill(id) {

    const bill =
        currentBills.find(
            b => b.id === id
        );

    if (!bill) return;

    document.getElementById(
        "editBillId"
    ).value = bill.id;

    document.getElementById(
        "editBillName"
    ).value = bill.billName;

    document.getElementById(
        "editAmount"
    ).value = bill.amount;

    document.getElementById(
        "editDueDate"
    ).value = bill.dueDate;

    document.getElementById(
        "editNotes"
    ).value =
        bill.notes || "";

    document.getElementById(
        "editRecurring"
    ).checked =
        bill.recurring || false;

    document.getElementById(
        "editModal"
    ).style.display =
        "flex";
}

window.editBill = editBill;

const saveEditBtn =
    document.getElementById(
        "saveEditBtn"
    );

const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );

if (saveEditBtn) {

    saveEditBtn.addEventListener(
        "click",
        saveEdit
    );
}

if (cancelEditBtn) {

    cancelEditBtn.addEventListener(
        "click",
        closeEditModal
    );
}

function closeEditModal() {

    document.getElementById(
        "editModal"
    ).style.display =
        "none";
}

async function saveEdit() {

    const id =
        document.getElementById(
            "editBillId"
        ).value;

    await updateDoc(
        doc(db, "bills", id),
        {

            billName:
                document.getElementById(
                    "editBillName"
                ).value,

            amount:
                Number(
                    document.getElementById(
                        "editAmount"
                    ).value
                ),

            dueDate:
                document.getElementById(
                    "editDueDate"
                ).value,

            notes:
                document.getElementById(
                    "editNotes"
                ).value,

            recurring:
                document.getElementById(
                    "editRecurring"
                ).checked

        }
    );

    closeEditModal();

    loadBills();
}

async function loadBills() {

    billList.innerHTML = "";

    let outstandingTotal = 0;
    let overdueCount = 0;
    let paidCount = 0;

    let dueThisWeek = 0;
    let recurringCount = 0;

    currentBills = [];

    const bills = currentBills;

    const snapshot =
        await getDocs(
            collection(db, "bills")
        );

    snapshot.forEach((billDoc) => {

        const bill = {
            id: billDoc.id,
            ...billDoc.data()
        };

        if (
    showingArchived &&
    !bill.archived
) {
    return;
}

if (
    !showingArchived &&
    bill.archived
) {
    return;
}

        if (currentUser.role === "admin") {

            bills.push(bill);

        } else if (
            bill.assignedTo ===
            currentUser.username
        ) {

            bills.push(bill);

        }

    });

    bills.sort((a, b) =>
        new Date(a.dueDate) -
        new Date(b.dueDate)
    );

    bills.forEach((bill) => {

        if (
    activePersonFilter !== "all" &&
    bill.assignedTo !== activePersonFilter
) {
    return;
}

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const dueDate =
            new Date(bill.dueDate);

        const diffDays = Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );

        if (
    diffDays >= 0 &&
    diffDays <= 7 &&
    bill.status !== "Paid"
) {
    dueThisWeek++;
}

if (bill.recurring) {
    recurringCount++;
}

        let cardClass = "";
        let displayStatus = bill.status;

        if (bill.status === "Paid") {

            cardClass = "paid";
            displayStatus = "Paid";

        } else if (diffDays < 0) {

            cardClass = "overdue";

            displayStatus =
                `Overdue by ${Math.abs(diffDays)} day${
                    Math.abs(diffDays) !== 1 ? "s" : ""
                }`;

            overdueCount++;

        } else if (diffDays === 0) {

            cardClass = "due";
            displayStatus = "Due Today";

        } else if (diffDays === 1) {

            cardClass = "due";
            displayStatus = "Due Tomorrow";

        } else {

            cardClass = "due";
            displayStatus =
                `Due in ${diffDays} days`;

        }

        if (
    activeStatusFilter === "paid" &&
    bill.status !== "Paid"
) {
    return;
}

if (
    activeStatusFilter === "recurring" &&
    !bill.recurring
) {
    return;
}

if (
    activeStatusFilter === "overdue" &&
    diffDays >= 0
) {
    return;
}

if (
    activeStatusFilter === "due" &&
    (diffDays < 0 || bill.status === "Paid")
) {
    return;
}

        if (bill.status === "Paid") {

            paidCount++;

        } else {

            outstandingTotal += bill.amount;

        }

        billList.innerHTML += `
            <div class="bill-card ${cardClass}">

                <h3>
                    ${bill.displayname || bill.assignedTo}
                </h3>

                <p>
    ${
        diffDays < 0 && bill.status !== "Paid"
        ? `<span class="overdue-badge">OVERDUE</span><br>`
        : ""
    }

    ${bill.billName}
    ${bill.recurring ? " 🔄" : ""}
</p>

                <p>$${bill.amount.toFixed(2)}</p>

                <p>Due: ${bill.dueDate}</p>

${
    bill.notes
        ? `<p><strong>Notes:</strong><br>${bill.notes}</p>`
        : ""
}

                <p>
                    <strong>
                        ${displayStatus}
                    </strong>
                </p>

                ${
    currentUser.role === "admin"
    ? `
    <div class="button-group">

        <button
            onclick="editBill('${bill.id}')">
            Edit
        </button>

        ${
            bill.status !== "Paid"
            ? `
            <button onclick="markPaid('${bill.id}')">
                Mark Paid
            </button>
            `
            : ""
        }

        ${
    bill.status === "Paid" &&
    !bill.archived
    ? `
    <button
        onclick="archiveBill('${bill.id}')">
        Archive
    </button>
    `
    : ""
}

<button
    class="delete-btn"
    onclick="deleteBill('${bill.id}')">
    Delete
</button>

    </div>
    `
    : ""
}

            </div>
        `;
    });

    document.getElementById(
        "outstandingTotal"
    ).textContent =
        `$${outstandingTotal.toFixed(2)}`;

    document.getElementById(
        "overdueCount"
    ).textContent =
        overdueCount;

    document.getElementById(
        "paidCount"
    ).textContent =
        paidCount;

    document.getElementById(
    "dueThisWeek"
).textContent =
    dueThisWeek;

document.getElementById(
    "recurringCount"
).textContent =
    recurringCount;
}

const savedUser =
    localStorage.getItem(
        "currentUser"
    );

if (savedUser) {

    currentUser =
        JSON.parse(savedUser);

    showApp();

    loadUsers();
}

function setupTabs() {

    const homeTab =
        document.getElementById("homeTab");

    const activityTab =
        document.getElementById("activityTab");

    const addBillTab =
    document.getElementById("addBillTab");

    const billForm =
        document.getElementById("billForm");

    const addBillSection =
    document.getElementById("addBillSection");

    const billList =
        document.getElementById("billList");

    const activitySection =
        document.getElementById("activitySection");

    if (!homeTab || !activityTab) {
        return;
    }

    homeTab.addEventListener("click", () => {

    addBillSection.style.display = "none";
    billList.style.display = "";
    activitySection.style.display = "none";

    homeTab.classList.add("active");
    addBillTab.classList.remove("active");
    activityTab.classList.remove("active");

});

    addBillTab.addEventListener("click", () => {

    addBillSection.style.display = "block";
    billList.style.display = "none";
    activitySection.style.display = "none";

    addBillTab.classList.add("active");
    homeTab.classList.remove("active");
    activityTab.classList.remove("active");

});

    activityTab.addEventListener("click", async () => {

    addBillSection.style.display = "none";
    billList.style.display = "none";
    activitySection.style.display = "block";

    activityTab.classList.add("active");
    homeTab.classList.remove("active");
    addBillTab.classList.remove("active");

    await loadUserActivity();

});

}
