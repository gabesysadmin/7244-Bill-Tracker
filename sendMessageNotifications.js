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

    const messagesSnapshot =
        await db.collection("messages")
                .where(
                    "notificationSent",
                    "==",
                    false
                )
                .get();

    if (messagesSnapshot.empty) {

        console.log(
            "No pending message notifications."
        );

        return;
    }

    const usersSnapshot =
        await db.collection("users")
                .get();

    const users = [];

    usersSnapshot.forEach((doc) => {

        const user = doc.data();

        if (
            user.notificationsEnabled === true &&
            user.fcmToken
        ) {

            users.push({
                token:
                    user.fcmToken
            });

        }

    });

    for (
        const messageDoc
        of messagesSnapshot.docs
    ) {

        const message = messageDoc.data();

        let sent = 0;

        for (const user of users) {

            try {

                await admin
    .messaging()
    .send({

        token:
            user.token,

        data: {

    title:
        "🏠 Household Update",

    body:
        message.message

}

    });

                sent++;

            } catch (err) {

                console.error(
                    err.message
                );

            }

        }

        await messageDoc.ref.update({

            notificationSent: true

        });

        console.log(
            `Sent ${sent} notification(s) for "${message.title}"`
        );

    }

})();
