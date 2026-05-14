import sqlite3

def run_cli():
    conn = sqlite3.connect('musafir.db')
    c = conn.cursor()
    
    print("=========================================")
    print(" Musafir AI - Local SQLite CLI ")
    print("=========================================")
    print("Type your SQL query and press Enter.")
    print("Example: SELECT * FROM transport_metadata;")
    print("Type 'exit' or 'quit' to close.")
    print()
    
    while True:
        try:
            query = input("sqlite> ")
            if query.strip().lower() in ['exit', 'quit']:
                break
            if not query.strip():
                continue
            
            c.execute(query)
            
            # If it's a SELECT query, fetch and print the results
            if query.strip().lower().startswith("select"):
                if c.description:
                    columns = [desc[0] for desc in c.description]
                    print(" | ".join(columns))
                    print("-" * 50)
                    for row in c.fetchall():
                        print(" | ".join(str(val) for val in row))
                print()
            else:
                # For INSERT/UPDATE/DELETE
                conn.commit()
                print(f"Executed successfully. Rows affected: {c.rowcount}\n")
                
        except sqlite3.Error as e:
            print(f"SQL Error: {e}\n")
        except (EOFError, KeyboardInterrupt):
            print("\nExiting...")
            break
            
    conn.close()

if __name__ == '__main__':
    run_cli()
