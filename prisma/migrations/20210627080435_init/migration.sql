-- CreateEnum
CREATE TYPE "CurrencyUnit" AS ENUM ('VND', 'USD', 'EUR', 'GBP', 'MYR', 'MMK', 'CNY', 'JPY');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "DegreeStatus" AS ENUM ('GRADUATED', 'NOT_GRADUATED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "AppEnum" AS ENUM ('HUMAN_RESOURCE', 'BUSSINESS');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('HUSBAND', 'WIFE', 'FATHER', 'MOTHER', 'DAUGHTER', 'SON');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'AGENCY');

-- CreateEnum
CREATE TYPE "CommodityUnit" AS ENUM ('KG', 'CON');

-- CreateEnum
CREATE TYPE "CustomerResource" AS ENUM ('RESEARCH', 'INTRODUCED', 'SELF_FIND', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('LIMITED', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE');

-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('UNIVERSITY', 'COLLEGE', 'INTERMEDIATE', 'MASTER', 'PHILOSOPHY');

-- CreateEnum
CREATE TYPE "FormalityType" AS ENUM ('FORMAL', 'INFORMAL', 'TRAINING', 'REMOTE');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('BASIC_ISNURANCE', 'BASIC', 'STAY', 'ALLOWANCE', 'OVERTIME', 'ABSENT');

-- CreateEnum
CREATE TYPE "DatetimeUnit" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT_CASH_FUND', 'ACCOUNTANT_MODERATION', 'SALESMAN', 'SALESMAN_EGG', 'IMPORTER_EXPORTER', 'CONSTRUCTION_DEPARTMENT', 'HUMAN_RESOURCE', 'CAMP_ACCOUNTING', 'CAMP_MANAGEMENT', 'CAMP_DIRECTOR', 'HATCHERY_ACCOUNTING', 'HATCHERY_MANAGEMENT', 'NONE');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "employeeId" INTEGER,
    "role" "Role" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Degree" (
    "id" SERIAL NOT NULL,
    "school" TEXT NOT NULL,
    "type" "DegreeType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "major" TEXT NOT NULL,
    "formality" "FormalityType" NOT NULL,
    "level" "DegreeLevel",
    "status" "DegreeStatus" NOT NULL,
    "note" TEXT,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" SERIAL NOT NULL,
    "stk" TEXT,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "nationId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "workday" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "contractId" TEXT,
    "type" "ContractType" NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avt" TEXT,
    "gender" "GenderType" NOT NULL,
    "phone" TEXT NOT NULL,
    "workPhone" TEXT,
    "birthday" TIMESTAMP(3) NOT NULL,
    "birthplace" TEXT NOT NULL,
    "identify" TEXT NOT NULL,
    "idCardAt" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "wardId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "religion" TEXT,
    "ethnicity" TEXT,
    "mst" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "workedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "isFlatSalary" BOOLEAN NOT NULL,
    "positionId" INTEGER NOT NULL,
    "note" TEXT,
    "facebook" TEXT,
    "zalo" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeTemplate" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SalaryType" DEFAULT E'OVERTIME',
    "price" DOUBLE PRECISION NOT NULL,
    "unit" "DatetimeUnit" DEFAULT E'HOUR',
    "note" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relative" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "GenderType" NOT NULL,
    "phone" TEXT NOT NULL,
    "workPhone" TEXT,
    "birthday" TIMESTAMP(3) NOT NULL,
    "birthplace" TEXT NOT NULL,
    "identify" TEXT,
    "idCardAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "wardId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "religion" TEXT,
    "ethnicity" TEXT,
    "mst" TEXT,
    "career" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "sos" BOOLEAN DEFAULT false,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avt" TEXT,
    "gender" "GenderType" NOT NULL,
    "phone" TEXT NOT NULL,
    "workPhone" TEXT,
    "birthday" TIMESTAMP(3) NOT NULL,
    "birthplace" TEXT NOT NULL,
    "identify" TEXT NOT NULL,
    "idCardAt" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "wardId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "religion" TEXT,
    "ethnicity" TEXT,
    "mst" TEXT,
    "type" "CustomerType" NOT NULL,
    "resource" "CustomerResource" NOT NULL,
    "isPotential" BOOLEAN DEFAULT false,
    "note" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commodity" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "CommodityUnit" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "explain" TEXT NOT NULL,
    "currency" "CurrencyUnit" NOT NULL,
    "paidTotal" DOUBLE PRECISION NOT NULL,
    "payType" "PaymentType" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "bsx" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salary" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SalaryType" NOT NULL,
    "times" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "unit" "DatetimeUnit" DEFAULT E'DAY',
    "rate" DOUBLE PRECISION DEFAULT 1,
    "datetime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "forgot" BOOLEAN DEFAULT false,
    "note" TEXT,
    "employeeId" INTEGER,
    "payrollId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "accConfirmedAt" TIMESTAMP(3),
    "manConfirmedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryHistory" (
    "id" SERIAL NOT NULL,
    "datetime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "salaryId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHistory" (
    "id" SERIAL NOT NULL,
    "appName" "AppEnum" NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "object" TEXT NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "ip" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommodityToOrder" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_OrderToRoute" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account.username_unique" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_employeeId_unique" ON "Account"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch.code_unique" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee.code_unique" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee.identify_unique" ON "Employee"("identify");

-- CreateIndex
CREATE UNIQUE INDEX "Relative.identify_unique" ON "Relative"("identify");

-- CreateIndex
CREATE UNIQUE INDEX "Customer.identify_unique" ON "Customer"("identify");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryHistory_salaryId_unique" ON "SalaryHistory"("salaryId");

-- CreateIndex
CREATE UNIQUE INDEX "_CommodityToOrder_AB_unique" ON "_CommodityToOrder"("A", "B");

-- CreateIndex
CREATE INDEX "_CommodityToOrder_B_index" ON "_CommodityToOrder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderToRoute_AB_unique" ON "_OrderToRoute"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderToRoute_B_index" ON "_OrderToRoute"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Degree" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bank" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Province" ADD FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relative" ADD FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relative" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryHistory" ADD FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryHistory" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemHistory" ADD FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityToOrder" ADD FOREIGN KEY ("A") REFERENCES "Commodity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityToOrder" ADD FOREIGN KEY ("B") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToRoute" ADD FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToRoute" ADD FOREIGN KEY ("B") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
