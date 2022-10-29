/*Create JSON for each employee with the following details (first name, department, designation, salary, raise eligible)
Sam, Tech, Manager, 40000, true
Mary, Finance, Trainee, 18500, true
Bill, HR, Executive, 21200, false
*/

Sam.name = "Sam"
Sam["name"] = "Sam"
let Sam = {
        name: "Sam",
        department: "Tech",
        job: "Manager",
        salary: 40000,
        raise: true
    };
let Mary = {
        name: "Mary",
        department: "Finance",
        job: "Trainee",
        salary: 18500,
        raise: true
    };
let  Bill = {
        name: "Bill",
        department: "HR",
        job: "Executive",
        salary: 21200,
        raise: false
    };

console.log("Problem 1", [Sam, Mary, Bill]);

//Create JSON for the company with the following details (companyName, website, employees)
//Tech Stars, www.techstars.site, array of Employees

const company = {
    companyName: "Tech Stars",
    website: "www.techstars.site",
    employees: [Sam, Mary, Bill],
};

console.log("Problem 2", company);

//A new employee has joined the company. Update the JSON from problems 1 and 2 to reflect the addition of:
//Anna, Tech, Executive, 25600, false

company.employees.push({
    name: "Anna",
    department: "HR",
    job: "Executive",
    salary: 25600,
    raise: false
});

console.log("Problem 3", company);

//Given the JSON for the company, calculate the total salary for all company employees.
let sum = 0;
for (let i = 0; i<company.employees.length;i++){
    sum += company.employees[i].salary;
}

console.log("Problem 4", sum);

//It's raise time. If an employee is raise eligible, increase their salary by 10%. Given the JSON of the company and its employees, write a function to update the salary for each employee who is raised eligible, then set their eligibility to false.

for (let i = 0; i<company.employees.length;i++){
    if(company.employees[i].raise){
        company.employees[i].salary *= 1.1;
        company.employees[i].raise = false; 
    }
}

console.log("Problem 5", company);

//Some employees have decided to work from home. The following array indicates who is working from home. Use the array to update the company JSON. For each employee, add another property called 'wfh' and set it to true of false
//Working from home: ['Anna', 'Sam']

const peopleWFH = ['Anna', 'Sam'];

for (var i = 0; i< company.employees.length;i++){
    company.employees[i].wfh = peopleWFH.includes(company.employees[i].name);
}

console.log("Problem 6", company);