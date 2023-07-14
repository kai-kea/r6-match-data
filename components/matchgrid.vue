<template>
  <ag-grid-vue
    style="width: 100%; height: 600px"
    class="ag-theme-alpine"
    :columnDefs="columnDefs"
    :rowData="rowData.value"
  >
  </ag-grid-vue>
</template>

<script>
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridVue } from "ag-grid-vue3";
import { db } from "../plugins/firebase.js";
import { collection, addDoc, query, getDocs } from "firebase/firestore";

export default {
  name: "App",
  components: {
    AgGridVue,
  },
  setup() {
    const rowData = reactive({});

    // add player data to firestore (untested)
    const addPlayer = async (player) => {
      try {
        await addDoc(collection(db, "Players"), player);
      } catch (error) {
        console.error("Error adding player: ", error);
      }
    };

    // get player data from firestore
    const getPlayers = async () => {
      const q = query(collection(db, "Players"));
      const querySnapshot = await getDocs(q);
      let players = querySnapshot.docs.map((doc) => doc.data());
      return players;
    };

    // reformat player data
    const convertToRowData = (players) => {
      return players.map((player) => ({
        DisplayName: player.DisplayName,
        kills: player.Lifetime.Kills,
        deaths: player.Lifetime.Deaths,
        assists: player.Lifetime.Assists,
        KOST: player.Lifetime.KOST,
        clutches: player.Lifetime["1vX"],
      }));
    };

    // load firestore player data into grid
    onMounted(() => {
      getPlayers().then((result) => {
        rowData.value = convertToRowData(result);
      });
    });

    return {
      addPlayer,
      getPlayers,
      convertToRowData,
      rowData,
      columnDefs: [
        // column definitions for the grid
        { headerName: "Name", field: "DisplayName" },
        { headerName: "Kills", field: "kills" },
        { headerName: "Deaths", field: "deaths" },
        { headerName: "Assists", field: "assists" },
        { headerName: "KOST", field: "KOST" },
        { headerName: "1vX", field: "clutches" },
      ],
    };
  },
};
</script>
