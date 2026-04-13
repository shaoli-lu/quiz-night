const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Bairdisnumberone1!@db.cceejcsqxlaqlgfjrtve.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows);
  } catch (err) {
    console.error('Connection error', err.message);
  } finally {
    await client.end();
  }
}
run();
