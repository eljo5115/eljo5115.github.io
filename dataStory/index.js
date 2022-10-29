const story = document.querySelector("#team-story");
fetch("./teamData.json") // this fetches the URL; .then takes the response of fetch and does something with it (twice over)
.then(teamData => response.text())

const teamRanks = [
    // in order (index 0 is 1st, 29 is last)
    "PHO",
    "MEM",
    "GSW",
    "MIA",
    "DAL",
    "BOS",
    "MIL",
    "PHI",
    "UTA",
    "DEN",
    "TOR",
    "CHI",
    "MIN",
    "BRK",
    "CLE",
    "ATL",
    "CHO",
    "LAC",
    "NYK",
    "NOP",
    "WSH",
    "SAS",
    "LAL",
    "SAC",
    "POR",
    "IND",
    "OKC",
    "DET",
    "ORL",
    "HOU"
]
console.log(teamData[teamRanks[4]]);

const storyText = "";
