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
const { v4: uuidv4 } = require("uuid");

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
  const matchFilePath = `matches-${uuidv4()}`;
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
      const matchFileName = "match-dissect.json";
      execSync(
        "./r6-dissect " +
          matchFilePath +
          " -x " +
          matchFilePath +
          "/" +
          matchFileName
      );

      // debug to see what files are here
      console.log("Checking matches directory: " + matchFilePath);
      fs.readdirSync(matchFilePath).forEach((file) => {
        console.log(file);
      });

      // Read json
      try {
        const data = fs.readFileSync(
          path.join(matchFilePath, matchFileName),
          "utf8"
        );

        const json = JSON.parse(data);

        // clean up files
        try {
          // Delete the file from the google cloud storage bucket
          await file.delete();
          console.log(`Removed Google Cloud Storage file`);
        } catch (err) {
          console.error(`Failed to remove Google Cloud Storage file`);
        }
        try {
          // Delete temp file within run service
          await fs.remove(tempFilePath);
          console.log(`Removed file at ${tempFilePath}.`);
        } catch (err) {
          console.error(
            `Failed to remove file at ${tempFilePath}. Reason: ${err.message}`
          );
        }
        try {
          // Delete r6-dissect directory
          await fs.remove(matchFilePath);
          console.log(`Removed directory at ${matchFilePath}.`);
        } catch (err) {
          console.error(
            `Failed to remove directory at ${matchFilePath}. Reason: ${err.message}`
          );
        }

        const matchID = json.rounds[0].matchID;

        // Extract the first round's "players" section
        const firstRoundPlayers = json.rounds[0].players;

        // Create a map of usernames to profileIDs
        const usernameToProfileID = {};
        firstRoundPlayers.forEach((player) => {
          usernameToProfileID[player.username] = player.profileID;
        });
        // Modify stats array to include profileID
        json.stats.forEach((playerStats) => {
          playerStats.profileID = usernameToProfileID[playerStats.username];
        });

        for (let player of firstRoundPlayers) {
          const playerDocRef = db.collection("Players").doc(player.profileID);

          // Extract player stats where stats.username matches player.username
          const playerStats = json.stats.find(
            (stat) => stat.username === player.username
          );

          // Check if player document exists
          const playerDoc = await playerDocRef.get();
          if (!playerDoc.exists) {
            // If the player document doesn't exist, create it
            await playerDocRef.set({
              username: player.username, // Add the username
            });
          }

          // Create or update data maps for the player using a transaction
          await db.runTransaction(async (transaction) => {
            const currentData = await transaction.get(playerDocRef);
            let updateData = {};

            // Iterate over each data point in the playerStats
            for (let key in playerStats) {
              // If the key is not username, profileID, or headshotPercentage, process it
              if (
                key !== "username" &&
                key !== "profileID" &&
                key !== "headshotPercentage"
              ) {
                const dataPointPath = `${key}.${matchID}`; // e.g. "kills.match1234"

                // Check if this specific data point for the current matchID already exists
                if (!currentData.get(dataPointPath)) {
                  updateData[dataPointPath] = playerStats[key];

                  // Calculate the sum for the data point only if the data point for this matchID is not already present
                  const currentSum = currentData.get(`${key}Sum`) || 0;
                  updateData[`${key}Sum`] = currentSum + playerStats[key];
                }
              }
            }

            // Update the player document with the data points and their sums
            transaction.update(playerDocRef, updateData);
          });
        }

        // Create Firestore document for match if it doesn't exist
        const matchDocRef = db.collection("Matches").doc(matchID);
        const matchDoc = await matchDocRef.get();
        if (!matchDoc.exists) {
          // Write match data
          await matchDocRef.set({
            matchID: matchID,
            map: json.rounds[0].map,
            timestamp: json.rounds[0].timestamp,
            TeamA: json.rounds[0].teams[0].name,
            TeamB: json.rounds[0].teams[1].name,
            stats: json.stats,
          });

          // Write round data
          for (let i = 0; i < json.rounds.length; i++) {
            const roundID = `${matchID}-${i}`;
            const roundRef = matchDocRef.collection("rounds").doc(roundID);
            await roundRef.set(json.rounds[i]);
          }

          res.send("File processed successfully");
        } else {
          console.log("Document already exists, exiting without overwriting.");
          console.log(matchID);
          res.send("Document already exists");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Error processing file");
      }
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
