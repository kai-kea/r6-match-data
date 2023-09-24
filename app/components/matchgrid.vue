<template>
  <ag-grid-vue
    style="width: 100%; height: calc(100vh - 120px)"
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
        DisplayName: player.username,
        KD: (player.killsSum / player.deathsSum).toFixed(2),
        kills: player.killsSum,
        deaths: player.deathsSum,
        assists: player.assistsSum,
        HSPercentage: ((player.headshotsSum * 100) / player.killsSum).toFixed(
          2
        ),
        headshots: player.headshotsSum,
        rounds: player.roundsSum,
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
        {
          headerName: "Name",
          field: "DisplayName",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "K/D",
          field: "KD",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Kills",
          field: "kills",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Deaths",
          field: "deaths",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Assists",
          field: "assists",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Headshot %",
          field: "HSPercentage",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Headshots",
          field: "headshots",
          sortable: true,
          flex: 1,
          filter: true,
        },
        {
          headerName: "Rounds",
          field: "rounds",
          sortable: true,
          flex: 1,
          filter: true,
        },
      ],
    };
  },
};
</script>
../src/plugins/firebase.js
