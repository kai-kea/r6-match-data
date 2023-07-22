<template>
  <div>
    <input v-model="fileName" type="text" placeholder="Enter file name" />
    <input type="file" accept=".zip" @change="processFile" />
  </div>
</template>

<script>
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../plugins/firebase.js";

export default {
  data() {
    return {
      fileName: "",
    };
  },
  methods: {
    async processFile(event) {
      const file = event.target.files[0];
      if (file && /\.(zip)$/i.test(file.name)) {
        const storage = getStorage(app);
        const storageRef = ref(storage, this.fileName + ".zip");
        const uploadName = this.fileName + ".zip";
        try {
          const uploadTask = uploadBytesResumable(storageRef, file);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // You can use this to show upload progress
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
            },
            (error) => {
              console.error("Error uploading file: ", error);
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
                  body: JSON.stringify({ uploadName }),
                }
              );
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
