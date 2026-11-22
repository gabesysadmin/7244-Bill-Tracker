import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("billForm");
const billList = document.getElementById("billList");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = {
        person: document.getElementById("person").value,
        billName: document.getElementById("billName").value,
        amount: Number(document.getElementById("amount").value),
        dueDate: document.getElementById("dueDate").value,
        status: "Due"
    };

    await addDoc(
        collection(db, "bills"),
        data
    );

    form.reset();

    loadBills();
});

async function markPaid(id) {

    const billRef = doc(db, "bills", id);

    await updateDoc(billRef, {
        status: "Paid",
        paidDate: new Date().toISOString()
    });

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

async function loadBills() {

    billList.innerHTML = "";

    let outstandingTotal = 0;
    let overdueCount = 0;
    let paidCount = 0;

    const snapshot = await getDocs(
        collection(db, "bills")
    );

    const bills = [];

    snapshot.forEach((billDoc) => {

        bills.push({
            id: billDoc.id,
            ...billDoc.data()
        });

    });

    bills.sort((a, b) => {

        const today = new Date();

        const aPaid = a.status === "Paid";
        const bPaid = b.status === "Paid";

        if (aPaid && !bPaid) return 1;
        if (!aPaid && bPaid) return -1;

        const aOverdue =
            new Date(a.dueDate) < today && !aPaid;

        const bOverdue =
            new Date(b.dueDate) < today && !bPaid;

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        return new Date(a.dueDate) - new Date(b.dueDate);

    });

    bills.forEach((bill) => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(bill.dueDate);

        const diffTime = dueDate - today;

        const diffDays = Math.ceil(
            diffTime / (1000 * 60 * 60 * 24)
        );

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
            displayStatus = `Due in ${diffDays} days`;

        }

        if (bill.status === "Paid") {

            paidCount++;

        } else {

            outstandingTotal += bill.amount;

        }

        billList.innerHTML += `
            <div class="bill-card ${cardClass}">

                <h3>${bill.person}</h3>

                <p>${bill.billName}</p>

                <p>$${bill.amount.toFixed(2)}</p>

                <p>Due: ${bill.dueDate}</p>

                <p><strong>${displayStatus}</strong></p>

                <div class="button-group">

                    ${
                        bill.status !== "Paid"
                        ? `<button onclick="markPaid('${bill.id}')">
                            Mark Paid
                           </button>`
                        : ""
                    }

                    <button class="delete-btn"
                            onclick="deleteBill('${bill.id}')">
                        Delete
                    </button>

                </div>

            </div>
        `;
    });

    document.getElementById("outstandingTotal").textContent =
        `$${outstandingTotal.toFixed(2)}`;

    document.getElementById("overdueCount").textContent =
        overdueCount;

    document.getElementById("paidCount").textContent =
        paidCount;
}

loadBills();
