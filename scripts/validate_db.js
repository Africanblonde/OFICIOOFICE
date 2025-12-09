"use strict";
/**
 * scripts/validate_db.ts
 *
 * Usage:
 * 1) Set `DATABASE_URL` (Postgres connection string) in your environment.
 *    Example (PowerShell):
 *      $env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname"
 *
 * 2) Run with ts-node (recommended for ad-hoc use):
 *      npx ts-node scripts/validate_db.ts
 *
 * 3) Or compile then run with node.
 *
 * What it checks:
 * - Empty-text UUID representations (uuid::text = '') in known FK columns
 * - NULL values found in NOT NULL columns (scans information_schema)
 * - Orphaned rows for a set of common foreign-key relationships
 * - Duplicate invoice numbers
 *
 * Exit codes:
 * - 0 = OK (no critical issues)
 * - 1 = Found critical issues (printed in JSON report)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var databaseUrl, client, report, emptyUuidTargets, _i, emptyUuidTargets_1, t, q, res, c, notNullColsRes, _a, _b, row, table, column, q, r, c, err_1, fkChecks, _c, fkChecks_1, fk, q, r, c, err_2, dupQ, dupR, _d, _e, r, err_3, criticalFound, err_4;
        var _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    databaseUrl = process.env.DATABASE_URL;
                    if (!databaseUrl) {
                        console.error('Please set DATABASE_URL env var (postgres connection).');
                        process.exit(2);
                    }
                    client = new pg_1.Client({ connectionString: databaseUrl });
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _m.sent();
                    report = {
                        emptyUuidCounts: {},
                        notNullViolations: [],
                        orphanedCounts: [],
                        duplicateInvoiceNumbers: []
                    };
                    _m.label = 2;
                case 2:
                    _m.trys.push([2, 23, 24, 26]);
                    emptyUuidTargets = [
                        { table: 'users', column: 'location_id' },
                        { table: 'transactions', column: 'location_id' },
                        { table: 'invoices', column: 'location_id' }
                    ];
                    _i = 0, emptyUuidTargets_1 = emptyUuidTargets;
                    _m.label = 3;
                case 3:
                    if (!(_i < emptyUuidTargets_1.length)) return [3 /*break*/, 6];
                    t = emptyUuidTargets_1[_i];
                    q = "SELECT COUNT(*)::int AS c FROM ".concat(t.table, " WHERE ").concat(t.column, " IS NOT NULL AND ").concat(t.column, "::text = ''");
                    return [4 /*yield*/, client.query(q)];
                case 4:
                    res = _m.sent();
                    c = (_g = (_f = res.rows[0]) === null || _f === void 0 ? void 0 : _f.c) !== null && _g !== void 0 ? _g : 0;
                    report.emptyUuidCounts["".concat(t.table, ".").concat(t.column)] = Number(c);
                    _m.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, client.query("\n      SELECT table_name, column_name\n      FROM information_schema.columns\n      WHERE table_schema = 'public' AND is_nullable = 'NO'\n      ORDER BY table_name\n    ")];
                case 7:
                    notNullColsRes = _m.sent();
                    _a = 0, _b = notNullColsRes.rows;
                    _m.label = 8;
                case 8:
                    if (!(_a < _b.length)) return [3 /*break*/, 13];
                    row = _b[_a];
                    table = row.table_name;
                    column = row.column_name;
                    q = "SELECT COUNT(*)::int AS c FROM ".concat(table, " WHERE ").concat(column, " IS NULL");
                    _m.label = 9;
                case 9:
                    _m.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, client.query(q)];
                case 10:
                    r = _m.sent();
                    c = Number((_j = (_h = r.rows[0]) === null || _h === void 0 ? void 0 : _h.c) !== null && _j !== void 0 ? _j : 0);
                    if (c > 0)
                        report.notNullViolations.push({ table: table, column: column, nullCount: c });
                    return [3 /*break*/, 12];
                case 11:
                    err_1 = _m.sent();
                    // Some columns (e.g., generated columns) may error out; ignore those
                    // but log for visibility
                    console.warn("Skipping NOT NULL check for ".concat(table, ".").concat(column, ":"), err_1.message);
                    return [3 /*break*/, 12];
                case 12:
                    _a++;
                    return [3 /*break*/, 8];
                case 13:
                    fkChecks = [
                        { table: 'transactions', column: 'user_id', ref_table: 'users', ref_column: 'id' },
                        { table: 'transactions', column: 'location_id', ref_table: 'locations', ref_column: 'id' },
                        { table: 'inventory', column: 'location_id', ref_table: 'locations', ref_column: 'id' },
                        { table: 'inventory', column: 'item_id', ref_table: 'items', ref_column: 'id' },
                        { table: 'transaction_items', column: 'transaction_id', ref_table: 'transactions', ref_column: 'id' },
                        { table: 'transaction_items', column: 'item_id', ref_table: 'items', ref_column: 'id' },
                        { table: 'invoice_items', column: 'invoice_id', ref_table: 'invoices', ref_column: 'id' },
                        { table: 'invoice_items', column: 'item_id', ref_table: 'items', ref_column: 'id' },
                        { table: 'users', column: 'location_id', ref_table: 'locations', ref_column: 'id' }
                    ];
                    _c = 0, fkChecks_1 = fkChecks;
                    _m.label = 14;
                case 14:
                    if (!(_c < fkChecks_1.length)) return [3 /*break*/, 19];
                    fk = fkChecks_1[_c];
                    q = "\n        SELECT COUNT(*)::int AS c\n        FROM ".concat(fk.table, " t\n        LEFT JOIN ").concat(fk.ref_table, " r ON t.").concat(fk.column, " = r.").concat(fk.ref_column, "\n        WHERE t.").concat(fk.column, " IS NOT NULL AND r.").concat(fk.ref_column, " IS NULL\n      ");
                    _m.label = 15;
                case 15:
                    _m.trys.push([15, 17, , 18]);
                    return [4 /*yield*/, client.query(q)];
                case 16:
                    r = _m.sent();
                    c = Number((_l = (_k = r.rows[0]) === null || _k === void 0 ? void 0 : _k.c) !== null && _l !== void 0 ? _l : 0);
                    report.orphanedCounts.push({ table: fk.table, column: fk.column, ref_table: fk.ref_table, ref_column: fk.ref_column, orphanCount: c });
                    return [3 /*break*/, 18];
                case 17:
                    err_2 = _m.sent();
                    console.warn("Skipping FK check ".concat(fk.table, ".").concat(fk.column, " -> ").concat(fk.ref_table, ".").concat(fk.ref_column, ":"), err_2.message);
                    return [3 /*break*/, 18];
                case 18:
                    _c++;
                    return [3 /*break*/, 14];
                case 19:
                    _m.trys.push([19, 21, , 22]);
                    dupQ = "\n        SELECT numero, COUNT(*)::int AS c\n        FROM invoices\n        WHERE numero IS NOT NULL AND TRIM(numero) <> ''\n        GROUP BY numero\n        HAVING COUNT(*) > 1\n        ORDER BY c DESC\n        LIMIT 100\n      ";
                    return [4 /*yield*/, client.query(dupQ)];
                case 20:
                    dupR = _m.sent();
                    for (_d = 0, _e = dupR.rows; _d < _e.length; _d++) {
                        r = _e[_d];
                        report.duplicateInvoiceNumbers.push({ numero: r.numero, count: Number(r.c) });
                    }
                    return [3 /*break*/, 22];
                case 21:
                    err_3 = _m.sent();
                    console.warn('Skipping duplicate invoice check:', err_3.message);
                    return [3 /*break*/, 22];
                case 22:
                    // Print JSON report
                    console.log(JSON.stringify(report, null, 2));
                    criticalFound = Object.values(report.emptyUuidCounts).some(function (v) { return v > 0; })
                        || report.notNullViolations.some(function (v) { return v.nullCount > 0; })
                        || report.orphanedCounts.some(function (v) { return v.orphanCount > 0; })
                        || report.duplicateInvoiceNumbers.length > 0;
                    if (criticalFound) {
                        console.error('\nCRITICAL ISSUES FOUND. Please review the report and fix before applying stricter constraints.');
                        process.exit(1);
                    }
                    console.log('\nNo critical data integrity issues found.');
                    process.exit(0);
                    return [3 /*break*/, 26];
                case 23:
                    err_4 = _m.sent();
                    console.error('Validation script failed:', err_4.message);
                    process.exit(3);
                    return [3 /*break*/, 26];
                case 24: return [4 /*yield*/, client.end()];
                case 25:
                    _m.sent();
                    return [7 /*endfinally*/];
                case 26: return [2 /*return*/];
            }
        });
    });
}
main();
