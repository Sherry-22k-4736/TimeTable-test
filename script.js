document.getElementById("searchBtn").addEventListener("click", searchClass);
document.getElementById("downloadPdfBtn").addEventListener("click", downloadPdf);

let timetableData = {}; // Store parsed timetable

// Fetch timetable data from the server (file in public folder)
async function fetchTimetableData() {
    try {
        // Fetch the .xlsx file directly from the server
        //const response = await fetch("https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/Sherry-22k-4736/Timetable/main/timetable.xlsx");
        //const response = await fetch("https://raw.githubusercontent.com/Sherry-22k-4736/Timetable/main/timetable.xlsx");
        const response = await fetch("./timetable.xlsx");
        if (!response.ok) {
            alert("Failed to load timetable data. Please mail k224736@nu.edu.pk ");
            return;
        }

        const arrayBuffer = await response.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        timetableData = {}; // Reset timetable data

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Ignore unnecessary sheets
            if (["Reserved Days", "BS Senior City Campus"].includes(sheetName)) return;

            timetableData[sheetName.trim()] = processSheetData(jsonData);
        });

        alert("Timetable loaded successfully! You can now search.");
    } catch (error) {
        alert("Failed to load timetable data.");
    }
}

// Call the function to fetch the timetable data when the page loads
window.onload = fetchTimetableData;

// Function to process each day's sheet data
function processSheetData(sheetData) {
    let daysData = [];
    let headers = sheetData[2]; // Third row contains slot numbers or times
    let classrooms = sheetData.slice(4); // Schedule starts from row 5

    classrooms.forEach(row => {
        let venue = row[0]; // Classroom name
        if (!venue) return;

        for (let i = 1; i < row.length; i++) {
            if (row[i]) {
                let courseDetails = row[i].split("\n"); // Handle multiple classes in one cell
                courseDetails.forEach(course => {
                    daysData.push({
                        slot: i, // Use column index as slot number for sorting
                        time: headers[i] ? headers[i].trim() : "Unknown Time",
                        venue: venue.trim(),
                        classInfo: course.trim()
                    });
                });
            }
        }
    });

    return daysData;
}

// Function to search for multiple classes
function searchClass() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (!searchInput) {
        resultsContainer.innerHTML = "<p>Please enter class names.</p>";
        return;
    }

    // Convert search terms into an array & trim spaces
    let searchTerms = searchInput.split(",").map(term => term.trim().toLowerCase());

    let resultsByDay = {}; // Group results by day

    for (const [day, classes] of Object.entries(timetableData)) {
        let matchingClasses = classes.filter(entry =>
            searchTerms.some(term => entry.classInfo.toLowerCase().includes(term))
        );

        if (matchingClasses.length > 0) {
            matchingClasses.sort((a, b) => a.slot - b.slot); // Sort by slot number
            resultsByDay[day] = matchingClasses;
        }
    }

    // Display results grouped by day
    if (Object.keys(resultsByDay).length === 0) {
        resultsContainer.innerHTML = "<p>No matches found.</p>";
        return;
    }

    // Show "Download PDF" button when results are available
    document.getElementById("downloadPdfBtn").style.display = "block";

    for (const [day, entries] of Object.entries(resultsByDay)) {
        let dayBlock = document.createElement("div");
        dayBlock.classList.add("day-section");

        let dayTitle = document.createElement("h3");
        dayTitle.textContent = day;
        dayBlock.appendChild(dayTitle);

        let classList = document.createElement("ul");
        entries.forEach(entry => {
            let listItem = document.createElement("li");
            listItem.textContent = `${entry.time} - ${entry.venue} - ${entry.classInfo}`;
            classList.appendChild(listItem);
        });

        dayBlock.appendChild(classList);
        resultsContainer.appendChild(dayBlock);
    }
}

// Function to download the timetable as a PDF
function downloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 10;
    doc.setFontSize(16);
    doc.text("Weekly Timetable", 20, yPos);
    yPos += 10;

    const resultsContainer = document.getElementById("results");
    const daySections = resultsContainer.getElementsByClassName("day-section");

    Array.from(daySections).forEach(daySection => {
        const dayTitle = daySection.getElementsByTagName("h3")[0].textContent;
        doc.setFontSize(14);
        doc.text(dayTitle, 20, yPos);
        yPos += 10;

        const classList = daySection.getElementsByTagName("ul")[0];
        Array.from(classList.getElementsByTagName("li")).forEach(classItem => {
            doc.setFontSize(12);
            doc.text(classItem.textContent, 20, yPos);
            yPos += 10;
        });
    });

    // Save the generated PDF
    doc.save("timetable.pdf");
}
