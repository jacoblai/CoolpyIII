var hasher = require("./")();
var expect = require("chai").expect;

describe("hasher", function() {

  it("should generate an hash from a password twice", function(done) {
    var opts = {
      password: "helloworld"
    };
    hasher(opts, function(err, pass, salt, hash) {
      opts.salt = salt;
      hasher(opts, function(err, pass, salt, hash2) {
        expect(hash2).to.be.equal(hash);
        done();
      });
    });
  });

  it("should generate a password if one is not present", function(done) {
    var opts = {
      password: "helloworld"
    };
    hasher(opts, function(err, pass, salt, hash) {
      expect(pass).to.be.a('string');
      done();
    });
  });
});
