const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

const User = require('../model/user.js');

describe('User', function() {
  let testUser;
  describe('tags', function()
  {
    before(function() {
      return new User(-1).then(user => testUser = user);
    });
    after(function() {
      testUser.delete();
    })
    it('should return true when adding a new tag', function() {
      return testUser.addTag('test').should.eventually.be.true;
    });
    it('should return false when adding a duplicate tag', function() {
      return testUser.addTag('test').should.eventually.be.false;
    });
    it('should return true when adding checking for a present tag', function() {
      return testUser.checkTag('test').should.eventually.be.true;
    });
    it('should return true when removing a present tag', function() { //(should this be non-dependant on previous tests?)
      return testUser.removeTag('test').should.eventually.be.true;
    });
    it('should return false when removing a non-present tag', function() {
      return testUser.removeTag('test').should.eventually.be.false;
    });
    it('should return false when clearing an empty set of tags', function() {
      return testUser.clearTags().should.eventually.be.empty;
    });
    it('should return the removed tags when clearing a non-empty set of tags', function() {
      var test1 = "test";
      var test2 = "test2";
      var testBoth = [test1, test2];
      return testUser.addTag(test1).then(() => {
        return testUser.clearTags().should.become([test1]);
      }).then(() => {
        return testUser.addTag(test2);
      }).then(() => {
        return testUser.clearTags().should.become([test2]);
      }).then(() => {
        return testUser.addTag(test1);
      }).then(() => {
        return testUser.addTag(test2);
      }).then(() => {
        return testUser.clearTags().should.become(testBoth);
      });
    });
    it('should return the removed tags(in lowercase) when clearing a non-empty set of tags', function() {
      var test1 = "TEST";
      return testUser.addTag(test1).then(() => {
        return testUser.clearTags().should.become(["test"]);
      })
    });
  });
  
});

const Page = require('../model/page.js');

describe('Page', function() {
  let testPage, testUser;
  describe('source', function() {
    before(function() {
      
      
      let getTestPage = new Page("test/testPage").then(page => {
        testPage = page;
      });
      let getTestUser = new User(-1).then(user => {
        testUser = user;
        return user.update({username: 'test1'});
      });
      return Promise.all([getTestPage, getTestUser]).then(() => {
        return testPage.updateAsUser(testUser, `
        # Hello World! 
        This is a test of protected content.
        {{ test1 | tom }} Only test1 and tom can see this content {{/}}
        This is content that is under the hidden content!
        {{ tom }} Only tom can see this content {{/}}
        `);
      });
    });
    after(function() {
      testPage.delete();
    })
    it('should be a string', function() {
      testPage.source.should.be.a('string');
    });
    it('hides hidden content from unauthorized users', function() {
      return testPage.getSourceForUser(testUser).should.not.eventually.contain("Only tom can see this content");
    });
    it('shows hidden content to authorized users', function() {
      return testPage.getSourceForUser(testUser).should.eventually.contain("Only test1 and tom can see this content");
    });
    it('deletes public content without deleting hidden content', function() {
        return testPage.updateAsUser(testUser, `
        # Hello World! 
        {{ test1 | tom }} Only test1 and tom can see this content {{/}}
        This is content that is under the hidden content!
        `).then(() => {
          return testPage.source.should.contain("Only tom can see this content");
        });
    });
    
  })
})