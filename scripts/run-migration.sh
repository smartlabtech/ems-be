#!/bin/bash

# Migration script to add productId to projectCopy records
# This script runs MongoDB commands using mongosh

echo "=== ProjectCopy ProductId Migration ==="
echo ""
echo "This script will update all projectCopy records with productId from their brandMessage"
echo ""

# Check if DB_URI is set
if [ -z "$DB_URI" ]; then
    # Try to load from .env file
    if [ -f ".env" ]; then
        export $(cat .env | grep DB_URI | xargs)
    fi
fi

if [ -z "$DB_URI" ]; then
    echo "ERROR: DB_URI environment variable not set"
    echo "Please set DB_URI or ensure .env file contains it"
    exit 1
fi

echo "Connecting to database..."

# Run the migration using mongosh
mongosh "$DB_URI" --eval '
// Migration Script
print("Starting migration...");

var db = db.getSiblingDB(db.getName());

// Count records without productId
var countWithout = db.projectCopy.countDocuments({ productId: { $exists: false } });
print("Found " + countWithout + " projectCopy records without productId");

if (countWithout === 0) {
    print("No records to update!");
    quit(0);
}

var updated = 0;
var skipped = 0;

// Process each record
db.projectCopy.find({ productId: { $exists: false } }).forEach(function(pc) {
    var bm = db.brandMessage.findOne({ _id: pc.brandMessageId });
    
    if (bm && bm.productId) {
        db.projectCopy.updateOne(
            { _id: pc._id },
            { $set: { productId: bm.productId, updatedAt: new Date() } }
        );
        updated++;
        print("Updated: " + pc._id);
    } else {
        skipped++;
    }
});

print("\n=== Summary ===");
print("Updated: " + updated);
print("Skipped: " + skipped);
print("Remaining without productId: " + db.projectCopy.countDocuments({ productId: { $exists: false } }));
'

echo ""
echo "Migration complete!"