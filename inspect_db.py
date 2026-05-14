import sqlite3
conn = sqlite3.connect('musafir.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print('TABLES:', tables)
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    count = cur.fetchone()[0]
    cur.execute(f"PRAGMA table_info({t})")
    cols = [r[1] for r in cur.fetchall()]
    print(f"  {t} ({count} rows): {cols}")
    if count > 0:
        cur.execute(f"SELECT * FROM {t} LIMIT 2")
        rows = cur.fetchall()
        for row in rows:
            print(f"    sample: {row}")
conn.close()
