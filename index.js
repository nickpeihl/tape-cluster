'use strict';

module.exports = wrapCluster;

function wrapCluster(tape, Cluster) {
    var test = buildTester(tape);

    test.only = buildTester(tape.only);
    test.skip = buildTester(tape.skip);

    return test;

    function buildTester(testFn) {
        return tester;

        function tester(testName, options, fn) {
            if (!fn && typeof options === 'function') {
                fn = options;
                options = {};
            }

            if (!fn) {
                return testFn(testName);
            }

            testFn(testName, onAssert);

            function onAssert(assert) {
                var _end = assert.end;
                assert.end = asyncEnd;

                options.assert = assert;
                var cluster = new Cluster(options);
                cluster.bootstrap(onCluster);

                function onCluster(err) {
                    if (err) {
                        return assert.end(err);
                    }

                    fn(cluster, assert);
                }

                function asyncEnd(err) {
                    if (err) {
                        assert.ifError(err);
                    }

                    cluster.close(onEnd);

                    function onEnd(err2) {
                        if (err2) {
                            assert.ifError(err2);
                        }

                        _end.call(assert);
                    }
                }
            }
        }
    }
}
