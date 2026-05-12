import pandas as pd

# ================== CONFIG ==================
old_file = 'old.csv'
new_file = 'new.csv'
output_file = 'updated.csv'
# ===========================================

# Load both files
old = pd.read_csv(old_file)
new = pd.read_csv(new_file)

print(f"Old rows: {len(old)}")
print(f"New rows: {len(new)}")

# Clean ingredient names (handles tabs and extra spaces)
old['ingredient'] = old['ingredient'].astype(str).str.replace('\t', ' ').str.strip()
new['ingredient'] = new['ingredient'].astype(str).str.replace('\t', ' ').str.strip()

# Find new ingredients
to_add = new[~new['ingredient'].isin(old['ingredient'])]

print(f"Found {len(to_add)} new ingredients to add.")

# Merge old + new
merged = pd.concat([old, to_add], ignore_index=True)

# Sort by ingredient name
merged = merged.sort_values(by='ingredient').reset_index(drop=True)

# === ADD THE NEW "notes" COLUMN ===
merged['notes'] = ""   # Empty string for all rows

# Reorder columns so "notes" is at the end
columns_order = ['ingredient', 'limit', 'unit', 'cycle_on', 'cycle_off', 'notes']
merged = merged[columns_order]

# Save
merged.to_csv(output_file, index=False)

print(f"\n✅ SUCCESS! Saved as '{output_file}'")
print(f"   Total rows: {len(merged)}")
print(f"   New rows added: {len(to_add)}")
print(f"   Added new column: 'notes' (empty)")

# Preview
print("\nFirst 5 rows with notes column:")
print(merged.head(5))
