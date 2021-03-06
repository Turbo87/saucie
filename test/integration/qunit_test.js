var chai = require('chai');
var Bluebird = require('bluebird');

chai.use(require('dirty-chai'));
var expect = require('chai').expect;

var launcher = require('../../lib/index');
var connect = launcher.connect;
var disconnect = launcher.disconnect;
var serveQUnit = require('../utils').serveQUnit;

var PORT = 7000;
var url = 'http://localhost:' + PORT;

describe('QUnit - Integration', function() {
  this.timeout(300000);

  var server;

  beforeEach(function (done) {
    serveQUnit(PORT, function(err, _server) {
      if (err) {
        return done(err);
      }

      server = _server;
      done();
    });
  });

  afterEach(function (done) {
    server.close(done);
  });

  it('runs qunit tests and reports the result', function(done) {
    launcher({url: url, connectRetries: 2}, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.have.deep.property('body.passed', true, 'Marked tests as passed');
      expect(result).to.have.deep.property('body.custom-data.qunit');

      var qunitResult = result.body['custom-data'].qunit;
      expect(qunitResult.failed).to.eq(0);
      expect(qunitResult.passed).to.eq(4);
      expect(qunitResult.total).to.eq(4);
      done();
    });
  });

  it('supports desktop browsers (selenium)', function(done) {
    launcher({
      url: url,
      connectRetries: 2,
      platformNameSL: 'Windows',
      platformVersionSL: '10'
    }, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.have.deep.property('body.passed', true, 'Marked tests as passed');
      expect(result).to.have.deep.property('body.custom-data.qunit');

      var qunitResult = result.body['custom-data'].qunit;
      expect(qunitResult.failed).to.eq(0);
      expect(qunitResult.passed).to.eq(4);
      expect(qunitResult.total).to.eq(4);
      done();
    });
  });

  it('supports mobile browsers (appium)', function(done) {
    launcher({
      url: url,
      connectRetries: 2,
      browserNameSL: 'Browser',
      deviceNameSL: 'Android Emulator',
      deviceOrientationSL: 'portrait',
      platformNameSL: 'Android',
      platformVersionSL: '5.1'
    }, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.have.deep.property('body.passed', true, 'Marked tests as passed');
      expect(result).to.have.deep.property('body.custom-data.qunit');

      var qunitResult = result.body['custom-data'].qunit;
      expect(qunitResult.failed).to.eq(0);
      expect(qunitResult.passed).to.eq(4);
      expect(qunitResult.total).to.eq(4);
      done();
    });
  });

  it('works when controlling the tunnel manually', function() {
    var pidFile = 'sc.pid';

    return Bluebird.using(function () {
      return connect({
        pidfile: pidFile,
        logger: console.log,
        verbose: true,
        tunnelIdentifier: 'Manual-' + process.env.TRAVIS_JOB_NUMBER,
        connectRetries: 2
      }).disposer(function() {
        return disconnect(pidFile);
      });
    }(), function () {
      return launcher({
        url: url,
        connect: false,
        tunnelIdentifierSL: 'Manual-' + process.env.TRAVIS_JOB_NUMBER
      }).then(function (result) {
        expect(result).to.have.deep.property('body.passed', true, 'Marked tests as passed');
        expect(result).to.have.deep.property('body.custom-data.qunit');
      });
    });
  });

  it('fails when specifing a small timeout', function() {
    return launcher({url: url, timeout: 1, connectRetries: 2}).catch(function (err) {
      expect(err).to.be.instanceof(Error);
      expect(err.message).to.eq('Timeout: Element not there');
    });
  });
});
