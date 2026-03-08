import Array "mo:core/Array";

persistent actor {
  // Test that Nat subtraction check - need to ensure no underflow
  func safeSub(a : Nat, b : Nat) : Nat {
    if (a > b) a - b else 0
  };
  
  public query func test() : async Nat {
    safeSub(65, 8)
  };
}
