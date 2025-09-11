# Production Deployment Guide - PCI DSS Assessment Fixes

## Summary
This deployment includes fixes for:
1. ✅ **PCI DSS assessment saving functionality** - Backend schema validation and data filtering
2. ✅ **Real-time progress bar updates** - Dynamic requirement group calculation
3. ✅ **Framework activation system** - Enable PCI DSS framework for organizations

## Changes Deployed
- `client/src/pages/pci-dss-gap-assessment.tsx` - Dynamic progress calculation with React.useMemo
- `server/routes/pci-dss-assessments.ts` - Fixed schema validation and header filtering  
- `scripts/activate-pci-dss-framework.ts` - Production framework activation script

## Post-Deployment Steps

### 1. Run Database Migrations (REQUIRED FOR SAVING)
Your production database is missing the PCI DSS assessments table. Run the migrations:

**Option A: Using Drizzle Push (Recommended)**
```bash
# Navigate to the project directory
cd /path/to/your/grc-manager

# Push schema to database (creates missing tables)
npm run db:push
```

**Option B: Using Migration Script**
```bash
# Run the migration script
npx tsx scripts/run-production-migrations.ts
```

**Option C: Manual Migration (if above fail)**
```bash
# Run the custom schema fix script
npx tsx scripts/fix-production-pci-dss-schema.ts
```

These will:
- Create the `pci_dss_assessments` table with correct schema
- Add the required `is_header` column
- Set up all foreign key relationships
- Enable assessment saving functionality

### 2. Activate PCI DSS Framework (REQUIRED)
Run this command on the production server to enable PCI DSS functionality:

```bash
# Run the activation script
npx tsx scripts/activate-pci-dss-framework.ts
```

This script will:
- Find the existing PCI DSS framework in the database
- Link it to the Default Organization with `isActive: true`
- Enable the PCI DSS gap assessment in the sidebar navigation

### 3. Verify Framework Activation
After running both scripts, you should see:
- "PCI DSS Gap Assessment" appears in the left sidebar navigation
- Dashboard shows "1 active framework" instead of "0 active frameworks"
- Users can access `/pci-dss-gap-assessment` page without errors

### 4. Test PCI DSS Assessment Features
1. **Navigate to PCI DSS Gap Assessment**
   - Should load without errors
   - Should display all 12 requirements with sub-requirements

2. **Test Progress Bar Updates**
   - Change any requirement status (e.g., from "Not Applied" to "Completed")
   - Progress bars should update immediately without page refresh
   - Requirement 1, 2, etc. progress should reflect changes in real-time

3. **Test Assessment Saving**
   - Make changes to assessment statuses, owners, tasks, comments
   - Click "Save Assessment" button
   - Should see success message "Assessment Saved"
   - Refresh page to verify changes are persisted

## Technical Details

### Progress Bar Fix
- **Issue**: Progress bars used static data from `getRequirementGroups()`
- **Solution**: Dynamic calculation using `React.useMemo` based on current `assessmentData`
- **Result**: Real-time updates when status changes

### Assessment Saving Fix  
- **Issue**: Backend schema validation rejected frontend data structure
- **Solution**: Updated schema to accept `id` and `isHeader` fields, filter headers before save
- **Result**: Assessments save successfully without schema errors

### Framework Activation
- **Issue**: PCI DSS framework not linked to organizations in production
- **Solution**: Script creates `organizationFrameworks` record with `isActive: true`
- **Result**: PCI DSS assessment becomes accessible in navigation

## Troubleshooting

### If PCI DSS Assessment saving fails:
1. **Check if table exists**: Run `npm run db:push` to create missing tables
2. **Check database schema**: Verify `pci_dss_assessments` table has `is_header` column
3. **Check browser console**: Look for "Invalid assessment data" or schema validation errors
4. **Check backend logs**: Look for "ZodError" or table/column not found errors
5. **Manual verification**: Run `npx tsx scripts/fix-production-pci-dss-schema.ts`

### If PCI DSS Assessment not visible in sidebar:
1. Check framework activation: `SELECT * FROM organization_frameworks WHERE is_active = true;`
2. Re-run activation script: `npx tsx scripts/activate-pci-dss-framework.ts`
3. Restart the application server

### If saving fails:
1. Check browser console for error messages
2. Verify backend logs for schema validation errors
3. Ensure user has write permissions (not read-only role)

### If progress bars don't update:
1. Check browser console for React errors
2. Verify the frontend changes are properly deployed
3. Clear browser cache and reload

## Expected Behavior After Deployment

✅ **Framework Navigation**: PCI DSS Gap Assessment visible in sidebar
✅ **Assessment Loading**: Page loads with all requirements and saved data
✅ **Real-time Updates**: Progress bars update immediately on status changes  
✅ **Data Persistence**: Save button works and data persists across sessions
✅ **Dashboard Metrics**: Framework shows as active (1 active framework)

## Rollback Plan
If issues occur, you can temporarily deactivate the framework:
```sql
UPDATE organization_frameworks 
SET is_active = false 
WHERE framework_id = (SELECT id FROM frameworks WHERE name = 'PCI DSS');
```

---
*Deployment completed on: September 11, 2025*
*Git commit: bfe8ee7*
