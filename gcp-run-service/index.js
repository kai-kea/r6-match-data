const express = require("express");
const fs = require("fs-extra");
const unzipper = require("unzipper");
const Firestore = require("@google-cloud/firestore");
const execSync = require("child_process").execSync;
const cors = require("cors");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const path = require("path");
const os = require("os");

const app = express();

app.use(cors());
app.use(express.json());

const serviceAccount = require("./r6-match-data-firebase-adminsdk-yzxwd-305de75196.json");

const db = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

app.post("/process-file", async (req, res) => {
  const fileName = req.body.uploadName;
  const file = storage.bucket("r6-match-data.appspot.com").file(fileName);

  // debug to see what files are here
  console.log("Current directory: " + process.cwd());
  fs.readdirSync(process.cwd()).forEach((file) => {
    console.log(file);
  });

  // Download the file to a temporary directory
  const tempFilePath = path.join(os.tmpdir(), fileName);
  await file.download({ destination: tempFilePath });

  // Process file
  const matchFilePath = "matches";
  fs.createReadStream(tempFilePath)
    .pipe(unzipper.Extract({ path: matchFilePath }))
    .on("close", async () => {
      // Check if there's only one directory inside matchFilePath
      const files = fs.readdirSync(matchFilePath);
      if (
        files.length === 1 &&
        fs.lstatSync(path.join(matchFilePath, files[0])).isDirectory()
      ) {
        const folderPath = path.join(matchFilePath, files[0]);
        const folderFiles = fs.readdirSync(folderPath);

        // Move all .rec files from the folder to matchFilePath
        for (const file of folderFiles) {
          if (path.extname(file) === ".rec") {
            await fs.move(
              path.join(folderPath, file),
              path.join(matchFilePath, file)
            );
          }
        }

        // Remove the now empty folder
        await fs.remove(folderPath);
      }

      // Execute the r6-dissect command and read the output JSON file
      execSync(
        "./r6-dissect " + matchFilePath + " -x " + matchFilePath + "/match.json"
      );
      // debug to see what files are here
      console.log("Checking matches directory: " + matchFilePath);
      fs.readdirSync(matchFilePath).forEach((file) => {
        console.log(file);
      });
      console.log("I really hope matches.json is in here.");

      // Read json
      try {
        const data = fs.readFileSync(
          path.join(matchFilePath, "match.json"),
          "utf8"
        );
        const json = JSON.parse(data);

        // Extract the "stats" section
        const stats = json.stats;

        // Extract the first round's "players" section
        const firstRoundPlayers = json.rounds[0].players;

        // Create a map of usernames to profileIDs
        const usernameToProfileID = {};
        firstRoundPlayers.forEach((player) => {
          usernameToProfileID[player.username] = player.profileID;
        });

        // Create Firestore documents
        const promises = stats.map(async (player) => {
          const docRef = db
            .collection("Players")
            .doc(usernameToProfileID[player.username]);
          const doc = await docRef.get();
          if (doc.exists) {
            // If document exists, add old numeric data to new data
            const oldData = doc.data();
            for (const key in oldData) {
              if (
                typeof oldData[key] === "number" &&
                typeof player[key] === "number"
              ) {
                player[key] += oldData[key];
              }
            }
            return docRef.set(player);
          } else {
            // If document does not exist, create new document with new data
            return docRef.set(player);
          }
        });

        try {
          await Promise.all(promises);
          res.send("File processed successfully");
        } catch (err) {
          console.error("Error writing to Firestore: ", err);
          res.status(500).send("Error processing file");
        }
      } catch (err) {
        console.error(err);
      }
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
