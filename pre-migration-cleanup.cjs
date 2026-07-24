var mysql = require('mysql2/promise');
var DB = 'hp_brain';

function dropColumnSafely(c, table, col) {
  return c.query(
    'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
    [DB, table, col]
  ).then(function (result) {
    var rows = result[0];
    var chain = Promise.resolve();
    rows.forEach(function (row) {
      chain = chain.then(function () {
        return c.query('ALTER TABLE ' + table + ' DROP FOREIGN KEY ' + row.CONSTRAINT_NAME)
          .then(function () { console.log('  dropped FK: ' + table + '.' + row.CONSTRAINT_NAME); })
          .catch(function (e) { console.log('  FK drop skipped: ' + table + '.' + row.CONSTRAINT_NAME + ' (' + e.message + ')'); });
      });
    });
    return chain;
  }).then(function () {
    return c.query('ALTER TABLE ' + table + ' DROP COLUMN IF EXISTS ' + col)
      .then(function () { console.log('ok: ' + table + '.' + col); })
      .catch(function (e) { console.log('skip: ' + table + '.' + col + ' (' + e.message + ')'); });
  });
}

async function main() {
  var c = await mysql.createConnection({
    host: '202.47.117.220',
    port: 3306,
    user: 'dev_db',
    password: 'dev@sql26',
    database: DB
  });

  var drops = [
    ['decisions', 'confidence'],
    ['decisions', 'explanation'],
    ['decisions', 'trace'],
    ['evidence', 'observed_date'],
    ['recommendations', 'urgency'],
    ['recommendations', 'expected_roi'],
    ['policies', 'policy_type'],
    ['policies', 'rules'],
    ['policies', 'version'],
    ['policies', 'previous_version_id']
  ];

  for (var i = 0; i < drops.length; i++) {
    await dropColumnSafely(c, drops[i][0], drops[i][1]);
  }

  console.log('cleanup complete');
  await c.end();
}

main().catch(function (e) { console.error(e); process.exit(1); });