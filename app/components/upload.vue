<template>
  <div>
    <input type="file" accept=".zip" @change="processFile" />
    <div v-if="uploading">
      <p>{{ progress }}% uploaded</p>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid"; // To generate random UUIDs
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../plugins/firebase.js";

export default {
  data() {
    return {
      uploading: false,
      progress: 0,
    };
  },
  methods: {
    async processFile(event) {
      const file = event.target.files[0];
      if (file && /\.(zip)$/i.test(file.name)) {
        const storage = getStorage(app);

        // Generate a UUID for the file name
        const uploadName = uuidv4() + ".zip";
        const storageRef = ref(storage, uploadName);

        try {
          const uploadTask = uploadBytesResumable(storageRef, file);
          this.uploading = true;

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Show upload progress
              this.progress = (
                (snapshot.bytesTransferred / snapshot.totalBytes) *
                100
              ).toFixed(2);
            },
            (error) => {
              console.error("Error uploading file: ", error);
              this.uploading = false;
            },
            () => {
              console.log("File uploaded successfully");
              fetch(
                "https://r6-match-data-service-23xzwf5raq-uc.a.run.app/process-file",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ uploadName: uploadName }),
                }
              );
              this.uploading = false;
            }
          );
        } catch (error) {
          console.error("Error uploading file: ", error);
        }
      } else {
        console.error("Invalid file type. Please upload a .zip file.");
      }
    },
  },
};
</script>
../src/plugins/firebase.js
