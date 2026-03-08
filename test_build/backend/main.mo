import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";

persistent actor {
  // ---- Auth ----
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ---- Shared (immutable) return types used in public API ----
  type PlayerInfo = {
    id : Nat;
    name : Text;
    position : Text;
    overall : Nat;
    speed : Nat;
    strength : Nat;
    awareness : Nat;
    teamId : Nat;
  };

  type TeamInfo = {
    id : Nat;
    name : Text;
    city : Text;
    abbreviation : Text;
    primaryColor : Text;
    secondaryColor : Text;
    wins : Nat;
    losses : Nat;
    isUserTeam : Bool;
  };

  type GameInfo = {
    id : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    homeScore : Nat;
    awayScore : Nat;
    week : Nat;
    isPlayed : Bool;
    isUserGame : Bool;
  };

  type PlayResult = {
    yardsGained : Int;
    isTouchdown : Bool;
    isInterception : Bool;
    isFumble : Bool;
    description : Text;
  };

  type GameResult = {
    userScore : Nat;
    opponentScore : Nat;
    userWon : Bool;
    weekNumber : Nat;
  };

  type TeamStanding = {
    teamId : Nat;
    teamName : Text;
    city : Text;
    wins : Nat;
    losses : Nat;
    primaryColor : Text;
  };

  // ---- Internal mutable record types ----
  type Team = {
    id : Nat;
    name : Text;
    city : Text;
    abbreviation : Text;
    primaryColor : Text;
    secondaryColor : Text;
    var wins : Nat;
    var losses : Nat;
    isUserTeam : Bool;
  };

  type Game = {
    id : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    var homeScore : Nat;
    var awayScore : Nat;
    week : Nat;
    var isPlayed : Bool;
    isUserGame : Bool;
  };

  // ---- State ----
  var nextId : Nat = 1;
  var teams : [Team] = [];
  var players : [PlayerInfo] = [];
  var games : [Game] = [];
  var seeded : Bool = false;
  var userTeamId : ?Nat = null;
  var playSeed : Nat = 12345;

  // ---- Utility ----
  func newId() : Nat {
    let id = nextId;
    nextId += 1;
    id
  };

  func rng(extra : Nat) : Nat {
    playSeed := (playSeed * 1664525 + 1013904223 + extra) % 4294967296;
    playSeed
  };

  func randBelow(extra : Nat, max : Nat) : Nat {
    rng(extra) % max
  };

  func safeSub(a : Nat, b : Nat) : Nat {
    if (a > b) a - b else 0
  };

  func pushPlayer(item : PlayerInfo) {
    let size = players.size();
    players := Array.tabulate<PlayerInfo>(size + 1, func(i : Nat) : PlayerInfo {
      if (i < size) players[i] else item
    });
  };

  func pushTeam(item : Team) {
    let size = teams.size();
    teams := Array.tabulate<Team>(size + 1, func(i : Nat) : Team {
      if (i < size) teams[i] else item
    });
  };

  func pushGame(item : Game) {
    let size = games.size();
    games := Array.tabulate<Game>(size + 1, func(i : Nat) : Game {
      if (i < size) games[i] else item
    });
  };

  func makePlayer(tid : Nat, pname : Text, pos : Text, ovr : Nat) : PlayerInfo {
    let spd = safeSub(ovr, randBelow(ovr, 8));
    let str_ = safeSub(ovr, randBelow(ovr + 1, 8));
    let awr = safeSub(ovr, randBelow(ovr + 2, 8));
    {
      id = newId();
      name = pname;
      position = pos;
      overall = ovr;
      speed = spd;
      strength = str_;
      awareness = awr;
      teamId = tid;
    }
  };

  func addPlayers(tid : Nat) {
    let pos : [Text] = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "OL", "OL", "OL", "DL", "DL", "LB", "LB", "CB", "CB", "S", "K"];
    let names : [Text] = [
      "Marcus Cole", "Darius Holt", "Jamal Rivers", "Tyrese Flynn", "Cameron Brooks",
      "Devon Shaw", "Malik Turner", "Andre King", "Jordan Reed", "Elijah Price",
      "Quinton Bell", "Isaiah Hart", "Bryce Morgan", "Kendall Stone",
      "Lorenzo Davis", "Terrance Fox", "Nathaniel Cross", "Caleb Simmons",
    ];
    var i = 0;
    while (i < pos.size()) {
      let ovr = 65 + randBelow(tid + i, 28);
      let p = makePlayer(tid, names[i], pos[i], ovr);
      pushPlayer(p);
      i += 1;
    };
  };

  func seedAITeams() {
    if (seeded) return;
    seeded := true;

    let data : [(Text, Text, Text, Text, Text)] = [
      ("Storm", "Chicago", "CHI", "#0B4F6C", "#FFFFFF"),
      ("Blaze", "Dallas", "DAL", "#B5121B", "#C8A951"),
      ("Wolves", "Seattle", "SEA", "#002244", "#69BE28"),
      ("Thunder", "Denver", "DEN", "#FB4F14", "#002244"),
      ("Ravens", "Baltimore", "BAL", "#241773", "#000000"),
      ("Sharks", "Miami", "MIA", "#005778", "#F26522"),
      ("Titans", "Nashville", "NAS", "#4B92DB", "#C8102E"),
      ("Lions", "Detroit", "DET", "#0076B6", "#B0B7BC"),
      ("Eagles", "Philadelphia", "PHI", "#004953", "#A5ACAF"),
      ("Bears", "Green Bay", "GBR", "#203731", "#FFB612"),
      ("Saints", "New Orleans", "NOS", "#D3BC8D", "#101820"),
      ("Chargers", "Los Angeles", "LAC", "#002A5E", "#FFC20E"),
      ("Falcons", "Atlanta", "ATL", "#A71930", "#000000"),
      ("Vikings", "Minnesota", "MIN", "#4F2683", "#FFC62F"),
      ("Panthers", "Carolina", "CAR", "#0085CA", "#101820"),
      ("Packers", "Kansas City", "KCP", "#E31837", "#FFB81C"),
    ];
    var i = 0;
    while (i < data.size()) {
      let (nm, ct, ab, pc, sc) = data[i];
      let t : Team = {
        id = newId();
        name = nm;
        city = ct;
        abbreviation = ab;
        primaryColor = pc;
        secondaryColor = sc;
        var wins = 0;
        var losses = 0;
        isUserTeam = false;
      };
      pushTeam(t);
      addPlayers(t.id);
      i += 1;
    };
  };

  func findTeam(tid : Nat) : ?Team {
    teams.find(func(t : Team) : Bool { t.id == tid })
  };

  func getUserTeam() : ?Team {
    switch (userTeamId) {
      case (null) null;
      case (?tid) findTeam(tid);
    }
  };

  func teamToInfo(t : Team) : TeamInfo {
    {
      id = t.id;
      name = t.name;
      city = t.city;
      abbreviation = t.abbreviation;
      primaryColor = t.primaryColor;
      secondaryColor = t.secondaryColor;
      wins = t.wins;
      losses = t.losses;
      isUserTeam = t.isUserTeam;
    }
  };

  func gameToInfo(g : Game) : GameInfo {
    {
      id = g.id;
      homeTeamId = g.homeTeamId;
      awayTeamId = g.awayTeamId;
      homeScore = g.homeScore;
      awayScore = g.awayScore;
      week = g.week;
      isPlayed = g.isPlayed;
      isUserGame = g.isUserGame;
    }
  };

  func buildSchedule(utid : Nat) {
    let ai = teams.filter(func(t : Team) : Bool { not t.isUserTeam });
    var week = 1;
    var i = 0;
    while (i < ai.size() and week <= 8) {
      let isHome = week % 2 == 0;
      let g : Game = {
        id = newId();
        homeTeamId = if (isHome) utid else ai[i].id;
        awayTeamId = if (isHome) ai[i].id else utid;
        var homeScore = 0;
        var awayScore = 0;
        week;
        var isPlayed = false;
        isUserGame = true;
      };
      pushGame(g);
      week += 1;
      i += 1;
    };
  };

  // ---- Public API ----

  public shared func createTeam(
    name : Text,
    city : Text,
    abbreviation : Text,
    primaryColor : Text,
    secondaryColor : Text,
  ) : async TeamInfo {
    seedAITeams();
    switch (userTeamId) {
      case (?tid) {
        teams := teams.filter(func(t : Team) : Bool { t.id != tid });
        players := players.filter(func(p : PlayerInfo) : Bool { p.teamId != tid });
        games := games.filter(func(g : Game) : Bool { not g.isUserGame });
      };
      case (null) {};
    };
    let t : Team = {
      id = newId();
      name;
      city;
      abbreviation;
      primaryColor;
      secondaryColor;
      var wins = 0;
      var losses = 0;
      isUserTeam = true;
    };
    pushTeam(t);
    userTeamId := ?t.id;
    addPlayers(t.id);
    buildSchedule(t.id);
    teamToInfo(t)
  };

  public query func getMyTeam() : async ?TeamInfo {
    switch (getUserTeam()) {
      case (null) null;
      case (?t) ?teamToInfo(t);
    }
  };

  public query func getRoster() : async [PlayerInfo] {
    switch (userTeamId) {
      case (null) [];
      case (?tid) players.filter(func(p : PlayerInfo) : Bool { p.teamId == tid });
    }
  };

  public query func getAITeams() : async [TeamInfo] {
    teams.filter(func(t : Team) : Bool { not t.isUserTeam }).map(teamToInfo)
  };

  public query func getSeasonSchedule() : async [GameInfo] {
    games.filter(func(g : Game) : Bool { g.isUserGame }).map(gameToInfo)
  };

  public query func getStandings() : async [TeamStanding] {
    teams.map(func(t : Team) : TeamStanding {
      {
        teamId = t.id;
        teamName = t.name;
        city = t.city;
        wins = t.wins;
        losses = t.losses;
        primaryColor = t.primaryColor;
      }
    })
  };

  public shared func callPlay(playType : Text) : async PlayResult {
    let roll = randBelow(7, 100);
    if (playType == "runLeft" or playType == "runRight") {
      if (roll < 5) {
        return { yardsGained = 0; isTouchdown = false; isInterception = false; isFumble = true; description = "FUMBLE! The ball is loose!" };
      } else if (roll < 20) {
        let loss : Int = -1 * (randBelow(roll, 3) + 1 : Nat);
        return { yardsGained = loss; isTouchdown = false; isInterception = false; isFumble = false; description = "Stopped for a loss." };
      } else if (roll < 70) {
        let gain : Int = (randBelow(roll + 1, 5) + 1 : Nat);
        return { yardsGained = gain; isTouchdown = false; isInterception = false; isFumble = false; description = "Run gains " # gain.toText() # " yards." };
      } else if (roll < 90) {
        let gain : Int = (randBelow(roll + 2, 4) + 6 : Nat);
        return { yardsGained = gain; isTouchdown = false; isInterception = false; isFumble = false; description = "Nice run for " # gain.toText() # " yards!" };
      } else {
        let gain : Int = (randBelow(roll + 3, 15) + 10 : Nat);
        let td = gain >= 20;
        return {
          yardsGained = gain;
          isTouchdown = td;
          isInterception = false;
          isFumble = false;
          description = if (td) "TOUCHDOWN! Incredible run!" else "Big run for " # gain.toText() # " yards!";
        };
      };
    } else if (playType == "passShort") {
      if (roll < 5) {
        return { yardsGained = 0; isTouchdown = false; isInterception = true; isFumble = false; description = "INTERCEPTED! Pass picked off!" };
      } else if (roll < 30) {
        return { yardsGained = 0; isTouchdown = false; isInterception = false; isFumble = false; description = "Incomplete pass." };
      } else if (roll < 80) {
        let gain : Int = (randBelow(roll + 1, 8) + 5 : Nat);
        return { yardsGained = gain; isTouchdown = false; isInterception = false; isFumble = false; description = "Short pass complete for " # gain.toText() # " yards." };
      } else {
        let gain : Int = (randBelow(roll + 2, 5) + 12 : Nat);
        let td = gain >= 15;
        return {
          yardsGained = gain;
          isTouchdown = td;
          isInterception = false;
          isFumble = false;
          description = if (td) "TOUCHDOWN! Pass in the end zone!" else "Pass complete for " # gain.toText() # " yards!";
        };
      };
    } else {
      // passDeep
      if (roll < 10) {
        return { yardsGained = 0; isTouchdown = false; isInterception = true; isFumble = false; description = "INTERCEPTED! Deep ball picked off!" };
      } else if (roll < 50) {
        return { yardsGained = 0; isTouchdown = false; isInterception = false; isFumble = false; description = "Incomplete - deep ball falls short." };
      } else if (roll < 82) {
        let gain : Int = (randBelow(roll + 1, 15) + 15 : Nat);
        let td = gain >= 25;
        return {
          yardsGained = gain;
          isTouchdown = td;
          isInterception = false;
          isFumble = false;
          description = if (td) "TOUCHDOWN! Deep strike!" else "Big gain of " # gain.toText() # " yards!";
        };
      } else {
        let gain : Int = (randBelow(roll + 2, 10) + 30 : Nat);
        return { yardsGained = gain; isTouchdown = true; isInterception = false; isFumble = false; description = "TOUCHDOWN! Long bomb connects!" };
      };
    };
  };

  public shared func simulateGame(opponentTeamId : Nat) : async GameResult {
    seedAITeams();
    let uScore = 14 + randBelow(opponentTeamId + 1, 29);
    let oScore = 7 + randBelow(opponentTeamId + 2, 29);
    let won = uScore > oScore;
    teams := teams.map(func(t : Team) : Team {
      if (t.isUserTeam) {
        if (won) { t.wins += 1 } else { t.losses += 1 };
      };
      t
    });
    var weekNum = 0;
    switch (getUserTeam()) {
      case (null) {};
      case (?ut) {
        games := games.map(func(g : Game) : Game {
          if (
            g.isUserGame and not g.isPlayed and
            (g.homeTeamId == opponentTeamId or g.awayTeamId == opponentTeamId)
          ) {
            weekNum := g.week;
            if (g.homeTeamId == ut.id) {
              g.homeScore := uScore;
              g.awayScore := oScore;
            } else {
              g.awayScore := uScore;
              g.homeScore := oScore;
            };
            g.isPlayed := true;
          };
          g
        });
      };
    };
    { userScore = uScore; opponentScore = oScore; userWon = won; weekNumber = weekNum }
  };

  public query func isSeasonSetup() : async Bool {
    userTeamId != null
  };

  public shared func resetSeason() : async () {
    games := games.map(func(g : Game) : Game {
      g.homeScore := 0;
      g.awayScore := 0;
      g.isPlayed := false;
      g
    });
    teams := teams.map(func(t : Team) : Team {
      t.wins := 0;
      t.losses := 0;
      t
    });
  };
}
