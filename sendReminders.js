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

        if (diffDays === 1) {

            title =
                "Bill Due Tomorrow";

            body =
                `${bill.billName} ($${bill.amount}) is due tomorrow.`;

        }
        else if (diffDays === 0) {

            title =
                "Bill Due Today";

            body =
                `${bill.billName} ($${bill.amount}) is due today.`;

        }
        else if (diffDays < 0) {

            title =
                "Bill Overdue";

            body =
                `${bill.billName} is overdue by ${Math.abs(diffDays)} day(s).`;

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

        sent++;
    }

    console.log(
        `${sent} reminder(s) sent`
    );

})();
