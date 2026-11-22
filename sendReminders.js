const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(
    fs.readFileSync(
        "serviceAccount.json",
        "utf8"
    )
);

admin.initializeApp({
    credential:
        admin.credential.cert(
            serviceAccount
        )
});

const db = admin.firestore();

(async () => {

    const usersSnapshot =
        await db.collection("users").get();

    const users = {};

    usersSnapshot.forEach(doc => {

        const user = doc.data();

        users[user.username] = user;

    });

    const billsSnapshot =
        await db.collection("bills").get();

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    let sent = 0;

    for (const billDoc of billsSnapshot.docs) {

        const bill =
            billDoc.data();

        if (
            bill.status === "Paid" ||
            bill.archived === true
        ) {
            continue;
        }

        const user =
            users[bill.assignedTo];

        if (
            !user ||
            !user.notificationsEnabled ||
            !user.fcmToken
        ) {
            continue;
        }

        const dueDate =
            new Date(bill.dueDate);

        const diffDays =
            Math.ceil(
                (
                    dueDate -
                    today
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );

        let title = null;
        let body = null;
        const todayString =
    today
        .toISOString()
        .split("T")[0];

if (
    bill.lastNotificationSent ===
    todayString
) {

    continue;
}

const overdueDays =
    Math.abs(diffDays);

if (diffDays === 5) {

    title =
        "Bill Due In 5 Days";

    body =
        `${bill.billName} ($${bill.amount}) is due in 5 days.`;

}
else if (diffDays === 0) {

    title =
        "Bill Due Today";

    body =
        `${bill.billName} ($${bill.amount}) is due today.`;

}
else if (
    diffDays < 0 &&
    (
        overdueDays === 7 ||
        overdueDays === 14 ||
        overdueDays === 30
    )
) {

    title =
        "Bill Overdue";

    body =
        `${bill.billName} is overdue by ${overdueDays} day(s).`;

}

        if (!title) {
            continue;
        }

        await admin
            .messaging()
            .send({

                token:
                    user.fcmToken,

                notification: {
                    title,
                    body
                }

            });

        await billDoc.ref.update({
    lastNotificationSent:
        todayString
});

sent++;
    }

    console.log(
        `${sent} reminder(s) sent`
    );

})();
