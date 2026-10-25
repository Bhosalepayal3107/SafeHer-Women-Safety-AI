/* =========================================================
   SafeHer - Women's Safety Web Application
   File: static/script.js

   Features:
   1. Page navigation
   2. Emergency SOS
   3. Trusted contacts
   4. Rule-based threat detection
   5. Safe journey planner
   6. Incident log
   7. Privacy reminders

   Important:
   - Trusted contacts and incident records are stored locally.
   - SOS messages are prepared for the user to send.
   - Emergency messages are NOT sent automatically.
   ========================================================= */


/* =========================================================
   1. GLOBAL VARIABLES
   ========================================================= */

var currentLocation = null;
var currentJourneyPlan = null;

var CONTACTS_KEY = "safeher_trusted_contacts";
var INCIDENTS_KEY = "safeher_incident_records";
var JOURNEY_KEY = "safeher_last_journey";


/* =========================================================
   2. GENERAL HELPER FUNCTIONS
   ========================================================= */

// Find an HTML element safely.
function getElement(id) {
    return document.getElementById(id);
}


// Display a message inside an HTML element.
function setStatus(id, message, type) {
    var element = getElement(id);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.remove("success", "error", "warning");

    if (type) {
        element.classList.add(type);
    }
}


// Convert text into a safe string for displaying.
function escapeHTML(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Generate a unique record ID.
function makeRecordId() {
    return Date.now().toString() +
        Math.random().toString(36).substring(2, 8);
}


// Read data from localStorage safely.
function readLocalData(key, defaultValue) {
    try {
        var savedData = localStorage.getItem(key);

        if (savedData === null) {
            return defaultValue;
        }

        return JSON.parse(savedData);
    } catch (error) {
        console.error("Unable to read saved data:", error);
        return defaultValue;
    }
}


// Save data to localStorage safely.
function saveLocalData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Unable to save data:", error);
        return false;
    }
}


// Open a link in a new browser tab.
function openExternalLink(url) {
    window.open(url, "_blank", "noopener,noreferrer");
}


/* =========================================================
   3. PAGE NAVIGATION
   ========================================================= */

// Show the selected page section.

function showSection(sectionId) {
    var sections = document.querySelectorAll(
        ".main-content > .page-section"
    );

    sections.forEach(function(section) {
        section.classList.remove("active");
    });

    var selectedSection = document.getElementById(sectionId);

    if (!selectedSection ||
        !selectedSection.classList.contains("page-section")) {
        console.warn("Page section not found:", sectionId);
        return;
    }

    selectedSection.classList.add("active");

    // Dynamic Topbar Page Title Update
    var pageTitles = {
        home: { title: "Dashboard", sub: "Your personal safety space" },
        sos: { title: "Emergency SOS", sub: "Immediate assistance & location dispatch" },
        remote: { title: "Remote & Hands-Free Safety", sub: "Discreet IoT & voice protection when phone is out of reach" },
        threat: { title: "Threat Detector", sub: "AI-powered digital safety & legal screening" },
        journey: { title: "Safe Journey", sub: "SafeWalk™ automated timer & journey planning" },
        incidents: { title: "Incident Log", sub: "Private digital evidence & timestamped records" },
        privacy: { title: "Privacy & Safety", sub: "Digital privacy reminders & security guidance" },
        about: { title: "About SafeHer", sub: "recHERsion '26 Women's Safety Project" }
    };
    var titleEl = document.getElementById("pageTitle");
    var topbarTitleBlock = document.querySelector(".topbar-title-block p, .topbar p");
    if (pageTitles[sectionId]) {
        if (titleEl) titleEl.textContent = pageTitles[sectionId].title;
        if (topbarTitleBlock) topbarTitleBlock.textContent = pageTitles[sectionId].sub;
    }

    var navigationItems = document.querySelectorAll(
        "[data-section], .nav-link, .sidebar a"
    );

    navigationItems.forEach(function(item) {
        var target = item.getAttribute("data-section") ||
            item.getAttribute("data-target");

        if (!target && item.getAttribute("href")) {
            target = item.getAttribute("href").replace("#", "");
        }

        item.classList.toggle("active", target === sectionId);
    });

    var sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}



// Show or hide the sidebar.

function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}


// Navigate to the privacy section.
function showPrivacy() {
    showSection("privacy");
}


// Navigate to the journey section.
function showJourney() {
    showSection("journey");
}


/* =========================================================
   4. TRUSTED CONTACTS
   ========================================================= */

// Get all trusted contacts.
function getTrustedContacts() {
    var contacts = readLocalData(CONTACTS_KEY, []);

    return Array.isArray(contacts) ? contacts : [];
}


// Save trusted contacts.
function saveTrustedContacts(contacts) {
    return saveLocalData(CONTACTS_KEY, contacts);
}


// Add a trusted contact.
function addTrustedContact(event) {
    if (event) {
        event.preventDefault();
    }

    var nameInput = getElement("contactName");
    var phoneInput = getElement("contactPhone");

    if (!nameInput || !phoneInput) {
        return;
    }

    var name = nameInput.value.trim();
    var phone = phoneInput.value.trim();

    if (!name || !phone) {
        alert("Please enter the contact name and phone number.");
        return;
    }

    // Accept phone numbers containing digits, spaces,
    // parentheses, plus signs, or hyphens.
    var cleanedPhone = phone.replace(/[\s()-]/g, "");

    if (!/^\+?\d{7,15}$/.test(cleanedPhone)) {
        alert("Please enter a valid phone number.");
        return;
    }

    var contacts = getTrustedContacts();

    // Avoid duplicate phone numbers.
    var duplicate = contacts.some(function(contact) {
        return contact.phone === cleanedPhone;
    });

    if (duplicate) {
        alert("This phone number is already in your trusted contacts.");
        return;
    }

    contacts.push({
        id: makeRecordId(),
        name: name,
        phone: cleanedPhone
    });

    if (!saveTrustedContacts(contacts)) {
        alert("Unable to save the contact in this browser.");
        return;
    }

    nameInput.value = "";
    phoneInput.value = "";

    renderTrustedContacts();

    setStatus(
        "sosStatus",
        "Trusted contact added successfully.",
        "success"
    );
}


// Delete a trusted contact.
function deleteTrustedContact(contactId) {
    var confirmed = window.confirm(
        "Are you sure you want to remove this trusted contact?"
    );

    if (!confirmed) {
        return;
    }

    var contacts = getTrustedContacts();

    contacts = contacts.filter(function(contact) {
        return contact.id !== contactId;
    });

    saveTrustedContacts(contacts);
    renderTrustedContacts();

    setStatus(
        "sosStatus",
        "Trusted contact removed.",
        "success"
    );
}


// Render the trusted contacts list.
function renderTrustedContacts() {
    var list = getElement("trustedContactsList");
    var contacts = getTrustedContacts();

    if (list) {
        list.innerHTML = "";

        if (contacts.length === 0) {
            list.innerHTML =
                '<p class="empty-state">' +
                'No trusted contacts added yet. ' +
                'Add someone you trust above.' +
                "</p>";
        } else {
            contacts.forEach(function(contact) {
                var item = document.createElement("div");

                item.className = "trusted-contact-item";

                var details = document.createElement("div");

                details.className = "trusted-contact-details";

                var nameElement = document.createElement("strong");
                nameElement.textContent = contact.name;

                var phoneElement = document.createElement("p");
                phoneElement.textContent = contact.phone;

                details.appendChild(nameElement);
                details.appendChild(phoneElement);

                var deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Remove";
                deleteButton.className = "delete-contact-btn";

                deleteButton.addEventListener("click", function() {
                    deleteTrustedContact(contact.id);
                });

                item.appendChild(details);
                item.appendChild(deleteButton);

                list.appendChild(item);
            });
        }
    }

    populateSOSContactDropdown();
    populateJourneyContacts();
}


// Populate the SOS contact dropdown.
function populateSOSContactDropdown() {
    var select = getElement("sosContactSelect");

    if (!select) {
        return;
    }

    var contacts = getTrustedContacts();
    var previousValue = select.value;

    select.innerHTML =
        '<option value="">Choose a trusted contact</option>';

    contacts.forEach(function(contact) {
        var option = document.createElement("option");

        option.value = contact.id;
        option.textContent = contact.name + " (" + contact.phone + ")";

        select.appendChild(option);
    });

    var optionExists = Array.from(select.options).some(function(option) {
        return option.value === previousValue;
    });

    if (optionExists) {
        select.value = previousValue;
    }
}


// Get the selected trusted contact.
function getSelectedSOSContact() {
    var select = getElement("sosContactSelect");

    if (!select || !select.value) {
        return null;
    }

    var contacts = getTrustedContacts();

    return contacts.find(function(contact) {
        return contact.id === select.value;
    }) || null;
}


/* =========================================================
   5. CURRENT LOCATION
   ========================================================= */

// Get the user's location using browser geolocation.
/* ==========================================
   SAFEHER: LIVE LOCATION FOR EMERGENCY SOS
   ========================================== */

var currentLocation = null;
var locationRequestInProgress = false;


// Get the user's current location.
function getCurrentLocation() {
    if (!navigator.geolocation) {
        setStatus(
            "locationStatus",
            "Your browser does not support location services.",
            "error"
        );
        return;
    }

    if (locationRequestInProgress) {
        setStatus(
            "locationStatus",
            "Getting your location. Please wait...",
            "warning"
        );
        return;
    }

    locationRequestInProgress = true;

    setStatus(
        "locationStatus",
        "Getting your current location...",
        "warning"
    );

    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            locationRequestInProgress = false;

            var mapURL = getLocationMapURL();

            setStatus(
                "locationStatus",
                "Location obtained successfully. Your map link is ready.",
                "success"
            );

            var mapLink = getElement("locationMapLink");

            if (mapLink) {
                mapLink.href = mapURL;
                mapLink.textContent = "View my location on Google Maps";
                mapLink.style.display = "inline-block";
                mapLink.target = "_blank";
                mapLink.rel = "noopener noreferrer";
            }
        },

        function(error) {
            locationRequestInProgress = false;

            var message =
                "Could not get your location. Please allow location access and try again.";

            if (error.code === error.PERMISSION_DENIED) {
                message =
                    "Location permission was denied. Allow location access in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message =
                    "Your current location is unavailable. Try moving to an area with a better GPS signal.";
            } else if (error.code === error.TIMEOUT) {
                message =
                    "Location request timed out. Please try again.";
            }

            setStatus("locationStatus", message, "error");
        },

        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        }
    );
}


// Build a Google Maps link from the obtained coordinates.
function getLocationMapURL() {
    if (!currentLocation) {
        return "";
    }

    var latitude = currentLocation.latitude;
    var longitude = currentLocation.longitude;

    return "https://www.google.com/maps?q=" +
        latitude + "," + longitude;
}


// Get the location text for the emergency message.
function getLocationMessage() {
    if (!currentLocation) {
        return (
            "Location is unavailable. Please ask me to share my location."
        );
    }

    return (
        "My current location:\n" +
        getLocationMapURL() +
        "\nCoordinates: " +
        currentLocation.latitude +
        ", " +
        currentLocation.longitude
    );
}


// Create the complete emergency message.
function buildSOSMessage() {
    var message =
        "🚨 EMERGENCY SOS - SAFEHER 🚨\n\n" +
        "I may be in danger and need your help.\n\n" +
        getLocationMessage() +
        "\n\nPlease contact me immediately and help me if needed.";

    return message;
}


// Get a fresh location before preparing the emergency message.
function getFreshLocation() {
    return new Promise(function(resolve, reject) {
        if (!navigator.geolocation) {
            reject(new Error("Location is not supported by this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                var mapLink = getElement("locationMapLink");

                if (mapLink) {
                    mapLink.href = getLocationMapURL();
                    mapLink.textContent = "View my location on Google Maps";
                    mapLink.style.display = "inline-block";
                    mapLink.target = "_blank";
                    mapLink.rel = "noopener noreferrer";
                }

                setStatus(
                    "locationStatus",
                    "Current location obtained successfully.",
                    "success"
                );

                resolve(currentLocation);
            },

            function(error) {
                var message =
                    "Could not get your location. Please allow location access.";

                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location permission was denied.";
                } else if (error.code === error.TIMEOUT) {
                    message = "Location request timed out.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Your location is currently unavailable.";
                }

                setStatus("locationStatus", message, "error");

                reject(new Error(message));
            },

            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    });
}


// Prepare and open an SMS containing the user's current location.
async function prepareSOSMessage() {
    var contact = getSelectedSOSContact();

    if (!contact) {
        alert("Please select a trusted contact first.");
        return;
    }

    setStatus(
        "sosSmsStatus",
        "Getting your current location before preparing the SMS...",
        "warning"
    );

    try {
        await getFreshLocation();

        var message = buildSOSMessage();

        var smsURL =
            "sms:" + contact.phone +
            "?body=" + encodeURIComponent(message);

        setStatus(
            "sosSmsStatus",
            "Your SMS includes your Google Maps location. Review the message and press Send.",
            "success"
        );

        window.location.href = smsURL;

    } catch (error) {
        setStatus(
            "sosSmsStatus",
            "Location could not be obtained. Allow location access and try again, or use your phone's location-sharing feature.",
            "error"
        );
    }
}


// Open WhatsApp with an emergency message containing the location.
async function sendSOSViaWhatsApp() {
    var contact = getSelectedSOSContact();

    if (!contact) {
        alert("Please select a trusted contact first.");
        return;
    }

    setStatus(
        "whatsappSOSStatus",
        "Getting your current location before opening WhatsApp...",
        "warning"
    );

    try {
        await getFreshLocation();

        var message = buildSOSMessage();

        // WhatsApp requires the recipient's number with country code,
        // using digits only and no leading plus sign.
        var whatsappPhone = contact.phone.replace(/\D/g, "");

        var whatsappURL =
            "https://wa.me/" +
            whatsappPhone +
            "?text=" +
            encodeURIComponent(message);

        setStatus(
            "whatsappSOSStatus",
            "Your WhatsApp message includes your Google Maps location. Review it and press Send.",
            "success"
        );

        window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
        );

    } catch (error) {
        setStatus(
            "whatsappSOSStatus",
            "Location could not be obtained. Allow location access and try again, or use your phone's location-sharing feature.",
            "error"
        );
    }
}
// Determine the risk level based on matching rules.


function detectThreats(message) {
    var text = String(message || "").toLowerCase();

    var threatRules = [{
            words: ["otp", "verification code", "one time password"],
            category: "OTP request",
            explanation: "The message mentions a verification code.",
            risk: "High"
        },
        {
            words: ["password", "bank details", "card number"],
            category: "Sensitive information",
            explanation: "The message mentions sensitive account or financial information.",
            risk: "High"
        },
        {
            words: ["blackmail", "leak your private photos", "send me money or"],
            category: "Blackmail",
            explanation: "The message may be threatening or attempting to blackmail you.",
            risk: "High"
        },
        {
            words: ["hurt you", "kill you", "follow you", "watching you", "know where you live"],
            category: "Threatening language",
            explanation: "The message contains potentially threatening language.",
            risk: "High"
        },
        {
            words: ["click this link", "click here", "unknown link"],
            category: "Suspicious link",
            explanation: "The message encourages clicking a potentially suspicious link.",
            risk: "Medium"
        },
        {
            words: ["urgent", "immediately", "act now"],
            category: "Urgent pressure",
            explanation: "The message uses urgency to pressure the recipient.",
            risk: "Medium"
        },
        {
            words: ["you have won", "claim your prize", "free gift"],
            category: "Possible scam",
            explanation: "The message may use a prize or gift as bait.",
            risk: "Medium"
        }
    ];

    var matches = [];

    threatRules.forEach(function(rule) {
        var matchedWords = rule.words.filter(function(word) {
            return text.includes(word);
        });

        if (matchedWords.length > 0) {
            matches.push({
                category: rule.category,
                explanation: rule.explanation,
                matchedWords: matchedWords,
                risk: rule.risk
            });
        }
    });

    var level = "Low";
    var score = 0;

    if (matches.some(function(item) {
            return item.risk === "High";
        })) {
        level = "High";
        score = 3;
    } else if (matches.length > 0) {
        level = "Moderate";
        score = 2;
    }

    return {
        level: level,
        score: score,
        matches: matches
    };
}


// Analyse the entered message.
function analyseMessage() {
    var input = getElement("messageInput");
    var result = getElement("analysisResult");

    if (!input || !result) {
        return;
    }

    var message = input.value.trim();

    if (!message) {
        result.innerHTML =
            '<div class="analysis-card warning">' +
            "<h3>Please enter a message</h3>" +
            "<p>Paste the message you want to check.</p>" +
            "</div>";

        return;
    }

    var analysis = detectThreats(message);

    var riskClass = "low-risk";
    var recommendation = "";

    if (analysis.level === "High") {
        riskClass = "high-risk";

        recommendation =
            "Do not respond if you feel unsafe. Save evidence, " +
            "consider blocking and reporting the sender, and contact " +
            "someone you trust. Seek emergency help if you are in immediate danger.";
    } else if (analysis.level === "Moderate") {
        riskClass = "medium-risk";

        recommendation =
            "Be cautious. Do not share passwords, OTPs, money, or private information. " +
            "Verify the sender and save the message if it concerns you.";
    } else {
        recommendation =
            "No listed warning phrases were detected. This does not guarantee " +
            "that the message is safe. Consider the context and trust your judgment.";
    }

    var html =
        '<div class="analysis-card ' + riskClass + '">' +
        "<h3>Analysis Result: " + escapeHTML(analysis.level) + " Risk</h3>" +
        "<p><strong>Risk score:</strong> " +
        escapeHTML(analysis.score) + " / 3</p>";

    if (analysis.matches.length > 0) {
        html += "<h4>Potential warning signs</h4><ul>";

        analysis.matches.forEach(function(match) {
            html +=
                "<li><strong>" +
                escapeHTML(match.category) +
                ":</strong> " +
                escapeHTML(match.explanation);

            html +=
                "<br><small>Matched phrases: " +
                escapeHTML(match.matchedWords.join(", ")) +
                "</small></li>";
        });

        html += "</ul>";
    } else {
        html +=
            "<p>No warning phrases from the current rules were found.</p>";
    }

    html +=
        "<h4>Recommended action</h4>" +
        "<p>" + escapeHTML(recommendation) + "</p>" +
        "<p><small>This is a rule-based screening tool, not a guarantee " +
        "of safety or a professional assessment.</small></p>" +
        "</div>";

    result.innerHTML = html;
}


// Load example messages into the threat detector.
function loadThreatExample(exampleType) {
    var input = getElement("messageInput");

    if (!input) {
        return;
    }

    var examples = {
        threat: "I know where you live. I will hurt you if you do not reply.",

        blackmail: "Send me money or I will leak your private photos.",

        suspicious: "Send your OTP and bank details immediately to verify your account.",

        safe: "Hello, are you available to discuss the college project tomorrow?"
    };

    input.value = examples[exampleType] || examples.threat;

    updateThreatCharacterCount();

    // Analyse the example immediately.
    analyseMessage();
}


// Clear the threat detector.
function clearThreatAnalysis() {
    var input = getElement("messageInput");
    var result = getElement("analysisResult");

    if (input) {
        input.value = "";
    }

    if (result) {
        result.innerHTML = "";
    }

    updateThreatCharacterCount();
}


// Update the message character count.
function updateThreatCharacterCount() {
    var input = getElement("messageInput");
    var counter = getElement("characterCount");

    if (input && counter) {
        counter.textContent = input.value.length;
    }
}


/* =========================================================
   8. SAFE JOURNEY PLANNER
   ========================================================= */

// Populate the journey contact dropdown.

function populateJourneyContacts() {
    var select = getElement("journeyContact");

    // Stop safely if the journey contact dropdown is missing.
    if (!select) {
        console.warn("Journey contact dropdown not found.");
        return;
    }

    var contacts = getTrustedContacts();
    var previousValue = select.value;

    // Clear the dropdown and add its default option.
    select.innerHTML = "";

    var defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent =
        "Select a trusted contact (optional)";

    select.appendChild(defaultOption);

    // Add saved trusted contacts.
    contacts.forEach(function(contact) {
        var option = document.createElement("option");

        option.value = contact.id;
        option.textContent =
            contact.name + " (" + contact.phone + ")";

        select.appendChild(option);
    });

    // Restore the previous selection if it still exists.
    var options = select.options || [];
    var exists = false;

    for (var i = 0; i < options.length; i++) {
        if (options[i].value === previousValue) {
            exists = true;
            break;
        }
    }

    if (exists) {
        select.value = previousValue;
    }
}


// Set a default departure time.
function setDefaultJourneyDeparture() {
    var departure = getElement("journeyDeparture");

    if (!departure || departure.value) {
        return;
    }

    var now = new Date();

    // Format date/time for an HTML datetime-local input.
    var localDateTime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);

    departure.value = localDateTime;
}


// Handle journey form submission.
function handleJourneySubmit(event) {
    if (event) {
        event.preventDefault();
    }

    var startInput = getElement("journeyStart");
    var destinationInput = getElement("journeyDestination");

    if (!startInput || !destinationInput) {
        return;
    }

    var start = startInput.value.trim();
    var destination = destinationInput.value.trim();

    if (!start || !destination) {
        setStatus(
            "journeyFormStatus",
            "Please enter both your starting point and destination.",
            "error"
        );

        return;
    }

    var modeElement = getElement("journeyMode");
    var departureElement = getElement("journeyDeparture");
    var arrivalElement = getElement("journeyArrival");
    var contactElement = getElement("journeyContact");
    var notesElement = getElement("journeyNotes");

    var mode = modeElement ? modeElement.value : "driving";
    var departure = departureElement ? departureElement.value : "";
    var arrival = arrivalElement ? arrivalElement.value : "";
    var contactId = contactElement ? contactElement.value : "";
    var notes = notesElement ? notesElement.value.trim() : "";

    if (departure && arrival) {
        var departureDate = new Date(departure);
        var arrivalDate = new Date(arrival);

        if (arrivalDate < departureDate) {
            setStatus(
                "journeyFormStatus",
                "Expected arrival cannot be earlier than departure.",
                "error"
            );

            return;
        }
    }

    var contacts = getTrustedContacts();

    var selectedContact = contacts.find(function(contact) {
        return contact.id === contactId;
    }) || null;

    currentJourneyPlan = {
        id: makeRecordId(),
        start: start,
        destination: destination,
        mode: mode,
        departure: departure,
        arrival: arrival,
        contact: selectedContact,
        notes: notes,
        createdAt: new Date().toISOString()
    };

    saveLocalData(JOURNEY_KEY, currentJourneyPlan);

    renderJourneyPlan(currentJourneyPlan);

    setStatus(
        "journeyFormStatus",
        "Your journey plan has been created successfully.",
        "success"
    );
}


// Display the journey plan.
function renderJourneyPlan(plan) {
    var result = getElement("journeyPlanResult");

    if (!result || !plan) {
        return;
    }

    var modeLabels = {
        driving: "Car",
        walking: "Walking",
        bicycling: "Bicycle",
        transit: "Public transport"
    };

    var html =
        '<div class="journey-result-card">' +
        "<h3>Your Safe Journey Plan</h3>" +
        "<p><strong>Starting point:</strong> " +
        escapeHTML(plan.start) + "</p>" +
        "<p><strong>Destination:</strong> " +
        escapeHTML(plan.destination) + "</p>" +
        "<p><strong>Travel mode:</strong> " +
        escapeHTML(modeLabels[plan.mode] || plan.mode) + "</p>";

    if (plan.departure) {
        html +=
            "<p><strong>Departure:</strong> " +
            escapeHTML(new Date(plan.departure).toLocaleString()) +
            "</p>";
    }

    if (plan.arrival) {
        html +=
            "<p><strong>Expected arrival:</strong> " +
            escapeHTML(new Date(plan.arrival).toLocaleString()) +
            "</p>";
    }

    if (plan.contact) {
        html +=
            "<p><strong>Trusted contact:</strong> " +
            escapeHTML(plan.contact.name) +
            " (" + escapeHTML(plan.contact.phone) + ")</p>";
    }

    if (plan.notes) {
        html +=
            "<p><strong>Notes:</strong> " +
            escapeHTML(plan.notes) + "</p>";
    }

    html +=
        "<h4>Journey safety checklist</h4>" +
        "<ul>" +
        "<li>Check your route before leaving.</li>" +
        "<li>Keep your phone charged.</li>" +
        "<li>Share your journey details with someone you trust.</li>" +
        "<li>Use well-lit, public routes where possible.</li>" +
        "<li>Confirm your arrival with your trusted contact.</li>" +
        "</ul>" +
        '<button type="button" id="journeyResultMapButton">' +
        "Open route in Google Maps</button>" +
        "</div>";

    result.innerHTML = html;

    var mapButton = getElement("journeyResultMapButton");

    if (mapButton) {
        mapButton.addEventListener("click", openJourneyDirections);
    }
}


// Open Google Maps directions.
function openJourneyDirections() {
    var plan = currentJourneyPlan ||
        readLocalData(JOURNEY_KEY, null);

    if (!plan) {
        alert("Please create a journey plan first.");
        return;
    }

    var url =
        "https://www.google.com/maps/dir/?api=1" +
        "&origin=" + encodeURIComponent(plan.start) +
        "&destination=" + encodeURIComponent(plan.destination) +
        "&travelmode=" + encodeURIComponent(plan.mode);

    openExternalLink(url);
}


// Open Google Maps using the route form.
function openJourneyMap() {
    openJourneyDirections();
}


// Prepare a journey update message.
function prepareJourneyUpdate() {
    var plan = currentJourneyPlan ||
        readLocalData(JOURNEY_KEY, null);

    if (!plan) {
        alert("Please create a journey plan first.");
        return;
    }

    if (!plan.contact) {
        alert(
            "Please select a trusted contact in your journey plan first."
        );

        return;
    }

    var message =
        "SafeHer Journey Update\n" +
        "Starting point: " + plan.start + "\n" +
        "Destination: " + plan.destination + "\n" +
        "Travel mode: " + plan.mode + "\n";

    if (plan.departure) {
        message += "Departure: " +
            new Date(plan.departure).toLocaleString() + "\n";
    }

    if (plan.arrival) {
        message += "Expected arrival: " +
            new Date(plan.arrival).toLocaleString() + "\n";
    }

    message +=
        "\nThis message was prepared using SafeHer. " +
        "Please confirm my safe arrival.";

    var smsURL =
        "sms:" + plan.contact.phone +
        "?body=" + encodeURIComponent(message);

    setStatus(
        "journeyActionStatus",
        "Your journey update is prepared. Review it and send it from your messaging app.",
        "success"
    );

    window.location.href = smsURL;
}


// Clear the journey form.
function clearJourneyForm() {
    var form = getElement("journeyForm");

    if (form) {
        form.reset();
    }

    var result = getElement("journeyPlanResult");

    if (result) {
        result.innerHTML = "";
    }

    setStatus("journeyFormStatus", "", "");

    currentJourneyPlan = null;

    setDefaultJourneyDeparture();
}


// Update the journey checklist progress.
function updateJourneyChecklistProgress() {
    var checks = document.querySelectorAll(".journey-check");
    var progress = getElement("journeyChecklistProgress");

    if (!progress) {
        return;
    }

    if (checks.length === 0) {
        progress.textContent = "0% completed";
        return;
    }

    var completed = 0;

    checks.forEach(function(check) {
        if (check.checked) {
            completed++;
        }
    });

    var percentage = Math.round(
        (completed / checks.length) * 100
    );

    progress.textContent =
        percentage + "% completed (" +
        completed + " of " + checks.length + ")";
}


/* =========================================================
   9. INCIDENT LOG
   ========================================================= */

// Read incident records.
function getIncidentRecords() {
    var records = readLocalData(INCIDENTS_KEY, []);

    return Array.isArray(records) ? records : [];
}


// Save incident records.
function saveIncidentRecords(records) {
    return saveLocalData(INCIDENTS_KEY, records);
}


// Update the incident notes character count.
function updateIncidentNotesCount() {
    var notes = getElement("incidentNotes");
    var counter = getElement("incidentNotesCount");

    if (notes && counter) {
        counter.textContent = notes.value.length;
    }
}


// Handle incident form submission.
function handleIncidentSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    var titleInput = getElement("incidentTitle");
    var dateInput = getElement("incidentDate");
    var categoryInput = getElement("incidentCategory");
    var locationInput = getElement("incidentLocation");
    var notesInput = getElement("incidentNotes");

    if (!titleInput || !dateInput || !categoryInput) {
        return;
    }

    var title = titleInput.value.trim();
    var date = dateInput.value;
    var category = categoryInput.value;
    var location = locationInput ? locationInput.value.trim() : "";
    var notes = notesInput ? notesInput.value.trim() : "";

    if (!title || !date || !category) {
        setStatus(
            "incidentFormStatus",
            "Please fill in the required incident details.",
            "error"
        );

        return;
    }

    var records = getIncidentRecords();

    var record = {
        id: makeRecordId(),
        title: title,
        date: date,
        category: category,
        location: location,
        notes: notes,
        createdAt: new Date().toISOString()
    };

    records.unshift(record);

    if (!saveIncidentRecords(records)) {
        setStatus(
            "incidentFormStatus",
            "Unable to save this incident in your browser.",
            "error"
        );

        return;
    }

    var form = getElement("incidentForm");

    if (form) {
        form.reset();
    }

    updateIncidentNotesCount();
    renderIncidentRecords();

    setStatus(
        "incidentFormStatus",
        "Incident saved successfully on this device.",
        "success"
    );
}


// Delete an incident record.
function deleteIncidentRecord(recordId) {
    var confirmed = window.confirm(
        "Are you sure you want to delete this incident record?"
    );

    if (!confirmed) {
        return;
    }

    var records = getIncidentRecords();

    records = records.filter(function(record) {
        return record.id !== recordId;
    });

    saveIncidentRecords(records);
    renderIncidentRecords();

    setStatus(
        "incidentFormStatus",
        "Incident record deleted.",
        "success"
    );
}


// Render incident records and apply the selected filter.
function renderIncidentRecords() {
    var list = getElement("incidentList");
    var countElement = getElement("incidentCount");
    var filterElement = getElement("incidentFilter");

    if (!list) {
        return;
    }

    var records = getIncidentRecords();
    var selectedCategory = filterElement ?
        filterElement.value :
        "all";

    var filteredRecords = records.filter(function(record) {
        return selectedCategory === "all" ||
            record.category === selectedCategory;
    });

    if (countElement) {
        countElement.textContent =
            filteredRecords.length + " incident(s)";
    }

    list.innerHTML = "";

    if (filteredRecords.length === 0) {
        list.innerHTML =
            '<p class="empty-state">' +
            "No incident records found. " +
            "Records you add will appear here." +
            "</p>";

        return;
    }

    filteredRecords.forEach(function(record) {
        var card = document.createElement("article");

        card.className = "incident-card";

        var title = document.createElement("h3");
        title.textContent = record.title;

        var date = document.createElement("p");
        date.textContent = "Date: " + record.date;

        var category = document.createElement("p");
        category.textContent = "Category: " + record.category;

        card.appendChild(title);
        card.appendChild(date);
        card.appendChild(category);

        if (record.location) {
            var location = document.createElement("p");

            location.textContent = "Location: " + record.location;

            card.appendChild(location);
        }

        if (record.notes) {
            var notes = document.createElement("p");

            notes.textContent = "Notes: " + record.notes;

            card.appendChild(notes);
        }

        var deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete record";
        deleteButton.className = "delete-incident-btn";

        deleteButton.addEventListener("click", function() {
            deleteIncidentRecord(record.id);
        });

        card.appendChild(deleteButton);
        list.appendChild(card);
    });
}


/* =========================================================
   10. PRIVACY REMINDERS
   ========================================================= */

function showPrivacyReminder() {
    var message =
        "SafeHer Privacy Reminder\n\n" +
        "1. Do not share your passwords or OTPs.\n" +
        "2. Review app permissions regularly.\n" +
        "3. Avoid posting your live location publicly.\n" +
        "4. Share journey details only with trusted people.\n" +
        "5. Keep evidence of threatening messages when safe to do so.\n\n" +
        "Trusted contacts and incident records are stored in this browser. " +
        "They are not automatically synchronized to another device.";

    alert(message);
}


/* =========================================================
   11. INITIALIZE THE APPLICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function() {
    console.log("SafeHer JavaScript loaded successfully.");

    // Initialize trusted contacts.
    renderTrustedContacts();

    // Initialize threat detector character counter.
    updateThreatCharacterCount();

    // Initialize incident notes counter.
    updateIncidentNotesCount();

    // Initialize incident records.
    renderIncidentRecords();

    // Initialize journey contact dropdown.
    populateJourneyContacts();

    // Set a default departure time.
    setDefaultJourneyDeparture();

    // Restore the last saved journey plan.
    var savedJourney = readLocalData(JOURNEY_KEY, null);

    if (savedJourney) {
        currentJourneyPlan = savedJourney;
        renderJourneyPlan(savedJourney);
    }

    // Connect the trusted contact form.
    var contactForm = getElement("contactForm");

    if (contactForm) {
        contactForm.addEventListener(
            "submit",
            addTrustedContact
        );
    }

    // Connect the threat detector input.
    var messageInput = getElement("messageInput");

    if (messageInput) {
        messageInput.addEventListener(
            "input",
            updateThreatCharacterCount
        );
    }

    // Connect the journey form.
    var journeyForm = getElement("journeyForm");

    if (journeyForm) {
        journeyForm.addEventListener(
            "submit",
            handleJourneySubmit
        );
    }

    // Connect the journey clear button.
    var clearJourneyButton = getElement("clearJourneyForm");

    if (clearJourneyButton) {
        clearJourneyButton.addEventListener(
            "click",
            clearJourneyForm
        );
    }

    // Connect the journey map button.
    var journeyMapButton = getElement("openJourneyMap");

    if (journeyMapButton) {
        journeyMapButton.addEventListener(
            "click",
            openJourneyDirections
        );
    }

    // Connect the journey update button.
    var journeyUpdateButton = getElement("shareJourneyUpdate");

    if (journeyUpdateButton) {
        journeyUpdateButton.addEventListener(
            "click",
            prepareJourneyUpdate
        );
    }

    // Connect the incident form.
    var incidentForm = getElement("incidentForm");

    if (incidentForm) {
        incidentForm.addEventListener(
            "submit",
            handleIncidentSubmit
        );
    }

    // Connect the incident notes counter.
    var incidentNotes = getElement("incidentNotes");

    if (incidentNotes) {
        incidentNotes.addEventListener(
            "input",
            updateIncidentNotesCount
        );
    }

    // Connect the incident filter.
    var incidentFilter = getElement("incidentFilter");

    if (incidentFilter) {
        incidentFilter.addEventListener(
            "change",
            renderIncidentRecords
        );
    }

    // Connect journey checklist items.
    var checklistItems = document.querySelectorAll(".journey-check");

    checklistItems.forEach(function(item) {
        item.addEventListener(
            "change",
            updateJourneyChecklistProgress
        );
    });

    updateJourneyChecklistProgress();

    console.log("SafeHer initialization completed.");
});
/* =========================================
   DASHBOARD INTERACTIONS
   ========================================= */

var safetyTips = [{
        title: "Protect Your Personal Information",
        text: "Never share your OTP, passwords, or banking details with someone who contacts you unexpectedly."
    },
    {
        title: "Plan Before Travelling",
        text: "Check your transport arrangements and consider informing someone you trust about your plans."
    },
    {
        title: "Trust Your Boundaries",
        text: "You can refuse requests that make you uncomfortable. You do not owe anyone access to your personal information."
    },
    {
        title: "Keep Your Phone Ready",
        text: "Charge your phone before leaving and know how to reach someone you trust if your plans change."
    },
    {
        title: "Think Before Sharing",
        text: "Be careful about posting live locations, private photographs, and personal details publicly."
    }
];

var currentSafetyTip = 0;


function setSafetyMood(mood, button) {
    var message = document.getElementById("safetyMoodMessage");

    var messages = {
        safe: "Glad to hear that. Keep respecting your boundaries and looking after yourself. 💗",
        cautious: "That is okay. Take your time, stay aware of your surroundings, and choose what feels right for you.",
        support: "You deserve support. Consider reaching out to someone you trust. If you are in immediate danger, contact emergency services."
    };

    document.querySelectorAll(".checkin-option").forEach(function(item) {
        item.classList.remove("selected");
    });

    if (button) {
        button.classList.add("selected");
    }

    if (message) {
        message.textContent = messages[mood] || "";
    }
}


function updateReadinessScore() {
    var ids = [
        "readyContact",
        "readyPhone",
        "readyTransport",
        "readyEmergency"
    ];

    var completed = 0;

    ids.forEach(function(id) {
        var checkbox = document.getElementById(id);

        if (checkbox && checkbox.checked) {
            completed++;
        }
    });

    var score = Math.round((completed / ids.length) * 100);

    var scoreElement = document.getElementById("readinessScore");
    var bar = document.getElementById("readinessProgressBar");

    if (scoreElement) {
        scoreElement.textContent = score;
    }

    if (bar) {
        bar.style.width = score + "%";
    }
}


function showNextSafetyTip() {
    currentSafetyTip = (currentSafetyTip + 1) % safetyTips.length;

    var tip = safetyTips[currentSafetyTip];

    var title = document.getElementById("dailyTipTitle");
    var text = document.getElementById("dailySafetyTip");

    if (title) {
        title.textContent = tip.title;
    }

    if (text) {
        text.textContent = tip.text;
    }
}


function updateLeaveChecklist() {
    var items = document.querySelectorAll(".leave-check");
    var completed = 0;

    items.forEach(function(item) {
        if (item.checked) {
            completed++;
        }
    });

    var progress = document.getElementById("leaveChecklistProgress");

    if (progress) {
        progress.textContent =
            completed + " of " + items.length + " completed";
    }
}


// Initialize the dashboard.
document.addEventListener("DOMContentLoaded", function() {
    updateReadinessScore();
    updateLeaveChecklist();
});

function clearThreatInput() {
    clearThreatAnalysis();
}

function updateCharacterCount() {
    updateThreatCharacterCount();
}

function activateEmergencySOS() {
    var contact = getSelectedSOSContact();

    if (!contact) {
        alert("Please select a trusted contact first.");
        return;
    }

    var confirmed = window.confirm(
        "Prepare an emergency message for " + contact.name +
        "? You will review and send the message yourself."
    );

    if (confirmed) {
        prepareSOSMessage();
    }
}

/* =========================================================
   HACKATHON UPGRADES: RECHERSION 2026 JAVASCRIPT
   1. Real Flask /api/analyze-threat NLP caller
   2. Discreet Fake Call Generator with Web Audio & Speech
   3. SafeWalk Dead-Man's Timer with PIN confirmation
   4. Working Stealth Calculator with secret exit
   5. High-Decibel Siren Audio Synthesizer
   ========================================================= */

// --- 1. Real AI Threat Analysis API Caller ---
async function analyseMessage() {
    var input = document.getElementById("messageInput");
    var resultBox = document.getElementById("analysisResult");
    if (!input || !resultBox) return;

    var text = input.value.trim();
    if (!text) {
        resultBox.innerHTML = '<div class="analysis-result-box warning"><h3>Please enter a message</h3><p>Paste the text you want to check for threats or harassment.</p></div>';
        return;
    }

    resultBox.innerHTML = '<div class="empty-state"><h3>🤖 Running AI Threat Model...</h3><p>Analyzing text with Scikit-Learn TF-IDF classifier and cyber law heuristics.</p></div>';

    try {
        var response = await fetch('/api/analyze-threat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        var data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Analysis failed');
        }

        renderAIThreatResult(data, text);
    } catch (err) {
        console.warn('Backend API unavailable, using client-side fallback:', err);
        // Fallback to client-side rule check
        var fallback = detectThreats(text);
        resultBox.innerHTML = '<div class="analysis-result-box ' + (fallback.level === 'High' ? 'danger' : 'warning') + '">' +
            '<h3>Analysis Result: ' + escapeHTML(fallback.level) + ' Risk</h3>' +
            '<p>Matches: ' + fallback.matches.map(function(m) { return m.category; }).join(', ') + '</p>' +
            '</div>';
    }
}

function renderAIThreatResult(data, originalText) {
    var resultBox = document.getElementById("analysisResult");
    if (!resultBox) return;

    var riskClass = data.risk_class || 'warning';
    var riskLevel = data.risk_level || 'Moderate Risk';
    var confidence = data.confidence || 75;

    var categoriesHtml = '';
    if (data.categories && data.categories.length > 0) {
        categoriesHtml = '<div class="threat-categories-row">' +
            data.categories.map(function(cat) {
                return '<span class="threat-pill">⚠️ ' + escapeHTML(cat) + '</span>';
            }).join('') +
            '</div>';
    }

    var actionsHtml = '';
    if (data.action_steps && data.action_steps.length > 0) {
        actionsHtml = '<div class="action-checklist-box"><strong>Recommended Actions:</strong><ul>' +
            data.action_steps.map(function(step) {
                return '<li>' + escapeHTML(step) + '</li>';
            }).join('') +
            '</ul></div>';
    }

    var legalHtml = '';
    if (data.legal_advisory && data.legal_advisory !== 'N/A') {
        legalHtml = '<div class="legal-advisory-box"><strong>⚖️ Applicable Legal Sections:</strong> ' +
            escapeHTML(data.legal_advisory) + '</div>';
    }

    // Auto-Log to Incident Register Button (Direct End-to-End Workflow)
    var autoLogButton = '<button type="button" class="log-incident-now-btn" onclick="autoLogThreatIncident(' +
        JSON.stringify(riskLevel) + ', ' +
        JSON.stringify(data.categories ? data.categories.join(', ') : 'Threat') + ', ' +
        JSON.stringify(originalText) + ')">' +
        '📋 Save as Incident Evidence' +
        '</button>';

    var html = '<div class="analysis-result-box ' + riskClass + '">' +
        '<div class="risk-header-row">' +
        '<span class="risk-level-badge ' + riskClass + '">● ' + escapeHTML(riskLevel) + '</span>' +
        '<span class="confidence-meter">AI Confidence: ' + confidence + '%</span>' +
        '</div>' +
        categoriesHtml +
        legalHtml +
        actionsHtml +
        autoLogButton +
        '</div>';

    resultBox.innerHTML = html;
}

// Auto-log incident helper
function autoLogThreatIncident(riskLevel, category, text) {
    var records = getIncidentRecords();
    var newRecord = {
        id: makeRecordId(),
        title: "AI Flagged: " + (category || "Threat Incident"),
        date: new Date().toISOString().split("T")[0],
        category: category.indexOf("Blackmail") !== -1 ? "Online Threat" : "Harassment",
        location: "Online / Digital Message",
        notes: "Risk Level: " + riskLevel + "\nMessage Content:\n" + text,
        createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    saveIncidentRecords(records);
    renderIncidentRecords();
    alert("Saved! This threat has been safely added to your Incident Log with full timestamp and legal tags.");
    showSection("incidents");
}

// --- 2. Discreet Fake Incoming Call Simulator ---
var fakeCallAudioContext = null;
var fakeCallOscillator = null;
var fakeCallRingInterval = null;
var fakeCallDurationTimer = null;
var fakeCallSeconds = 0;

function startFakeCallCountdown(seconds) {
    alert("Discreet fake call will ring in " + seconds + " seconds. Place your phone on the table or hold it.");
    setTimeout(function() {
        triggerFakeCallUI();
    }, seconds * 1000);
}

function triggerFakeCallUI() {
    var overlay = document.getElementById("fakeCallOverlay");
    var ringingActions = document.getElementById("fakeCallRingingActions");
    var connectedActions = document.getElementById("fakeCallConnectedActions");
    var callerName = document.getElementById("fakeCallerName");

    if (!overlay) return;

    // Set caller name to Dad or Home
    var contacts = getTrustedContacts();
    callerName.textContent = contacts.length > 0 ? contacts[0].name : "Dad 👨";

    ringingActions.style.display = "flex";
    connectedActions.style.display = "none";
    overlay.style.display = "flex";

    startRingtoneAudio();
}

function startRingtoneAudio() {
    stopRingtoneAudio();
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        fakeCallAudioContext = new AudioCtx();

        function playBeep() {
            if (!fakeCallAudioContext) return;
            var osc = fakeCallAudioContext.createOscillator();
            var gain = fakeCallAudioContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, fakeCallAudioContext.currentTime);
            osc.frequency.setValueAtTime(480, fakeCallAudioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, fakeCallAudioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, fakeCallAudioContext.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(fakeCallAudioContext.destination);
            osc.start();
            osc.stop(fakeCallAudioContext.currentTime + 1.2);
        }

        playBeep();
        fakeCallRingInterval = setInterval(playBeep, 2500);
    } catch (e) {
        console.warn("Web Audio not supported:", e);
    }
}

function stopRingtoneAudio() {
    if (fakeCallRingInterval) {
        clearInterval(fakeCallRingInterval);
        fakeCallRingInterval = null;
    }
    if (fakeCallAudioContext) {
        fakeCallAudioContext.close().catch(function() {});
        fakeCallAudioContext = null;
    }
}

function acceptFakeCall() {
    stopRingtoneAudio();
    var ringingActions = document.getElementById("fakeCallRingingActions");
    var connectedActions = document.getElementById("fakeCallConnectedActions");
    var state = document.getElementById("fakeCallState");

    ringingActions.style.display = "none";
    connectedActions.style.display = "block";
    state.textContent = "Call Connected";

    fakeCallSeconds = 0;
    var timerDisplay = document.getElementById("callDurationTimer");
    if (fakeCallDurationTimer) clearInterval(fakeCallDurationTimer);
    fakeCallDurationTimer = setInterval(function() {
        fakeCallSeconds++;
        var mins = String(Math.floor(fakeCallSeconds / 60)).padStart(2, '0');
        var secs = String(fakeCallSeconds % 60).padStart(2, '0');
        timerDisplay.textContent = mins + ":" + secs;
    }, 1000);

    // Speak audio simulation via speech synthesis so user can hold phone to ear
    if (window.speechSynthesis) {
        setTimeout(function() {
            var utterance = new SpeechSynthesisUtterance("Hello beta, are you on your way home? Your brother is waiting at the main gate. Let me know if you need us to pick you up.");
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }, 800);
    }
}

function endFakeCall() {
    stopRingtoneAudio();
    if (fakeCallDurationTimer) {
        clearInterval(fakeCallDurationTimer);
        fakeCallDurationTimer = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    var overlay = document.getElementById("fakeCallOverlay");
    if (overlay) overlay.style.display = "none";
}

// --- 3. SafeWalk Dead-Man's Timer ---
var safeWalkTimer = null;
var safeWalkSecondsLeft = 0;
var safeWalkStoredPin = "1234";

function setSafeWalkTime(minutes) {
    safeWalkSecondsLeft = minutes * 60;
    updateSafeWalkDisplay();
}

function updateSafeWalkDisplay() {
    var display = document.getElementById("safewalkTimeLeft");
    if (!display) return;
    var mins = String(Math.floor(safeWalkSecondsLeft / 60)).padStart(2, '0');
    var secs = String(safeWalkSecondsLeft % 60).padStart(2, '0');
    display.textContent = mins + ":" + secs;
}

function startSafeWalk() {
    if (safeWalkSecondsLeft <= 0) {
        safeWalkSecondsLeft = 15 * 60; // default 15 mins
    }
    var pinInput = document.getElementById("safewalkPin");
    safeWalkStoredPin = pinInput && pinInput.value.trim() ? pinInput.value.trim() : "1234";

    document.getElementById("safewalkSetup").style.display = "none";
    document.getElementById("safewalkActivePanel").style.display = "block";
    updateSafeWalkDisplay();

    if (safeWalkTimer) clearInterval(safeWalkTimer);
    safeWalkTimer = setInterval(function() {
        safeWalkSecondsLeft--;
        updateSafeWalkDisplay();

        if (safeWalkSecondsLeft <= 0) {
            clearInterval(safeWalkTimer);
            safeWalkTimer = null;
            triggerSafeWalkEmergency();
        }
    }, 1000);
}

function disarmSafeWalk() {
    var input = document.getElementById("disarmPinInput");
    var entered = input ? input.value.trim() : "";

    if (entered === safeWalkStoredPin) {
        if (safeWalkTimer) clearInterval(safeWalkTimer);
        safeWalkTimer = null;
        alert("SafeWalk confirmed safe! Timer disarmed successfully. Glad you are safe!");
        document.getElementById("safewalkActivePanel").style.display = "none";
        document.getElementById("safewalkSetup").style.display = "block";
        if (input) input.value = "";
    } else {
        alert("Incorrect PIN. Please enter your correct safety PIN to disarm.");
    }
}

async function triggerSafeWalkEmergency() {
    alert("⚠️ SAFENAV TIMER EXPIRED! Auto-triggering Emergency SOS...");
    // 1. Fetch location and log to backend
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            fetch('/api/emergency-dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: "SAFEWALK_EXPIRED",
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    message: "SafeWalk timer expired without safe check-in PIN."
                })
            }).catch(function() {});
        });
    }
    // 2. Open SOS section and prompt
    showSection("sos");
    prepareSOSMessage();
}

// --- 4. Stealth Mode (Calculator Disguise) ---
var calcCurrentVal = "0";
var calcSecretSequence = "";

function toggleStealthMode() {
    var overlay = document.getElementById("stealthCalcOverlay");
    if (!overlay) return;
    if (overlay.style.display === "none" || !overlay.style.display) {
        overlay.style.display = "flex";
        calcCurrentVal = "0";
        calcSecretSequence = "";
        updateCalcScreen();
    } else {
        overlay.style.display = "none";
    }
}

document.addEventListener("keydown", function(e) {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        toggleStealthMode();
    }
});

function updateCalcScreen() {
    var screen = document.getElementById("calcScreen");
    if (screen) screen.textContent = calcCurrentVal;
}

function calcInput(btn) {
    calcSecretSequence += btn;

    // Secret passcode to unlock: 1122=
    if (calcSecretSequence.endsWith("1122=")) {
        toggleStealthMode();
        return;
    }

    if (btn === "C") {
        calcCurrentVal = "0";
    } else if (btn === "=") {
        try {
            calcCurrentVal = String(eval(calcCurrentVal.replace(/×/g, "*").replace(/÷/g, "/")));
        } catch (e) {
            calcCurrentVal = "Error";
        }
    } else if (btn === "+/-") {
        calcCurrentVal = String(-parseFloat(calcCurrentVal) || 0);
    } else {
        if (calcCurrentVal === "0" && !isNaN(btn)) {
            calcCurrentVal = btn;
        } else {
            calcCurrentVal += btn;
        }
    }
    updateCalcScreen();
}

// --- 5. High-Decibel Siren Audio Synthesizer ---
var sirenAudioCtx = null;
var sirenOsc = null;
var sirenInterval = null;
var isSirenPlaying = false;

function toggleEmergencySiren() {
    var btn = document.querySelector(".siren-btn");
    if (isSirenPlaying) {
        stopEmergencySiren();
        if (btn) btn.classList.remove("active");
    } else {
        startEmergencySiren();
        if (btn) btn.classList.add("active");
    }
}

function startEmergencySiren() {
    isSirenPlaying = true;
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        sirenAudioCtx = new AudioCtx();
        sirenOsc = sirenAudioCtx.createOscillator();
        var gain = sirenAudioCtx.createGain();

        sirenOsc.type = "sawtooth";
        sirenOsc.frequency.setValueAtTime(700, sirenAudioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, sirenAudioCtx.currentTime);

        sirenOsc.connect(gain);
        gain.connect(sirenAudioCtx.destination);
        sirenOsc.start();

        var rising = true;
        sirenInterval = setInterval(function() {
            if (!sirenAudioCtx || !sirenOsc) return;
            var targetFreq = rising ? 1200 : 600;
            sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, sirenAudioCtx.currentTime + 0.35);
            rising = !rising;
        }, 400);
    } catch (e) {
        console.warn("Siren audio error:", e);
    }
}

function stopEmergencySiren() {
    isSirenPlaying = false;
    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }
    if (sirenOsc) {
        try { sirenOsc.stop(); } catch (e) {}
        sirenOsc = null;
    }
    if (sirenAudioCtx) {
        try { sirenAudioCtx.close(); } catch (e) {}
        sirenAudioCtx = null;
    }
}


/* =========================================================
   REMOTE & WEARABLE SAFETY (WEB BLUETOOTH & ACOUSTIC TRIGGER)
   ========================================================= */

var bleDevice = null;
var bleServer = null;

// Connect to real Web Bluetooth device (Smart ring / BLE panic button)
async function connectBluetoothWearable() {
    var statusBadge = document.getElementById("bleStatusBadge");
    var deviceName = document.getElementById("bleDeviceName");
    var btn = document.getElementById("pairBleBtn");

    if (!navigator.bluetooth) {
        alert("Web Bluetooth API is supported in Google Chrome, Microsoft Edge, and Opera on Windows, Android & Mac.\n\nFor this hackathon demo, you can use the '⚡ Test Wearable Trigger' button to demonstrate the remote trigger!");
        return;
    }

    try {
        statusBadge.textContent = "🔍 Scanning...";
        bleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', 'generic_access', 0x1802, 0x1803, 0xFFE0]
        });

        statusBadge.className = "status-pill online";
        statusBadge.textContent = "🟢 BLE Connected";
        deviceName.textContent = bleDevice.name || "Smart Wearable Fob";
        if (btn) btn.textContent = "✔ Wearable Paired";

        bleDevice.addEventListener('gattserverdisconnected', function() {
            statusBadge.className = "status-pill offline";
            statusBadge.textContent = "⚪ Disconnected";
            deviceName.textContent = "";
            if (btn) btn.textContent = "🔗 Connect Bluetooth Ring / Fob";
        });

        bleServer = await bleDevice.gatt.connect();
        alert("Success! Paired with: " + (bleDevice.name || "Smart Wearable") + "\n\nWhen the physical wearable button is clicked, SafeHer will automatically fire the emergency alarm!");
    } catch (err) {
        console.warn("Bluetooth pairing cancelled or error:", err);
        statusBadge.className = "status-pill offline";
        statusBadge.textContent = "⚪ Not Connected";
    }
}

// Simulate physical wearable button press (for hackathon presentation / offline demo)
function simulateWearablePress() {
    var actionType = "trusted";
    var actionSelect = document.getElementById("wearableAutoCallAction");
    if (actionSelect) {
        actionType = actionSelect.value;
    }

    var contacts = getTrustedContacts();
    var targetPhone = "112";
    var targetName = "Police Control Room (112)";

    if (actionType === "trusted" || actionType === "all") {
        if (contacts.length > 0) {
            targetPhone = contacts[0].phone;
            targetName = contacts[0].name + " (" + contacts[0].phone + ")";
        } else {
            targetPhone = "112";
            targetName = "National Emergency 112 (No trusted contact saved yet)";
        }
    } else if (actionType === "police") {
        targetPhone = "112";
        targetName = "Police Emergency (112)";
    }

    var alertMsg = "💍 [Smart Ring Button Clicked via BLE!]\n\n" +
        "⚡ AUTO-DIAL TRIGGERED:\n" +
        "📞 Immediately calling: " + targetName + "\n" +
        "📍 Live GPS Location being dispatched...\n\n" +
        "Press OK to initiate the phone call now.";

    if (confirm(alertMsg)) {
        // 1. Notify Backend Telephony Gateway (Twilio/Exotel API audit)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                fetch('/api/trigger-emergency-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: targetPhone,
                        caller_name: contacts.length > 0 ? contacts[0].name : "SafeHer User",
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        action_type: "BLE_RING_AUTO_CALL"
                    })
                }).catch(function() {});
            }, function() {
                fetch('/api/trigger-emergency-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: targetPhone,
                        caller_name: "SafeHer User",
                        action_type: "BLE_RING_AUTO_CALL"
                    })
                }).catch(function() {});
            });
        }

        // 2. If 'all' mode, sound deterrent siren
        if (actionType === "all" && typeof startEmergencySiren === "function") {
            startEmergencySiren();
            var sirenBtn = document.querySelector(".siren-btn");
            if (sirenBtn) sirenBtn.classList.add("active");
        }

        // 3. Initiate native mobile call dialer
        window.location.href = "tel:" + targetPhone;

        // 4. Also prepare backup SMS with GPS location
        setTimeout(function() {
            if (typeof prepareSOSMessage === "function") {
                prepareSOSMessage();
            }
        }, 1200);
    }
}


// --- Enhanced Always-On Voice-Activated Distress Trigger ---
var voiceRecognition = null;
var isVoiceListening = false;
var AUTO_VOICE_KEY = "safeher_auto_voice_guardian";

// Check if user has always-on voice guardian enabled (default to true)
function isAutoVoiceEnabled() {
    var stored = localStorage.getItem(AUTO_VOICE_KEY);
    return stored === null ? true : stored === "true";
}

function toggleAutoVoicePreference(enabled) {
    localStorage.setItem(AUTO_VOICE_KEY, enabled ? "true" : "false");
    var topbarBadge = document.getElementById("topbarVoiceGuardBadge");

    if (enabled) {
        startVoiceListening();
        if (topbarBadge) topbarBadge.style.display = "inline-flex";
    } else {
        stopVoiceListening();
        if (topbarBadge) topbarBadge.style.display = "none";
    }
}

function toggleVoiceTrigger() {
    if (isVoiceListening) {
        stopVoiceListening();
    } else {
        startVoiceListening();
    }
}

function startVoiceListening() {
    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var btn = document.getElementById("voiceToggleBtn");
    var statusBadge = document.getElementById("voiceStatusBadge");
    var feedback = document.getElementById("voiceTriggerFeedback");
    var topbarBadge = document.getElementById("topbarVoiceGuardBadge");

    if (!SpeechRec) {
        console.warn("Speech Recognition not supported in this browser.");
        if (statusBadge) {
            statusBadge.className = "status-pill offline";
            statusBadge.textContent = "⚪ Browser Speech Unsupported";
        }
        return;
    }

    if (isVoiceListening) return;

    try {
        voiceRecognition = new SpeechRec();
        voiceRecognition.continuous = true;
        voiceRecognition.interimResults = true;
        voiceRecognition.lang = "en-IN"; // Supports Indian accents (English/Hindi)

        voiceRecognition.onstart = function() {
            isVoiceListening = true;
            if (btn) btn.textContent = "⏹️ Pause Listening";
            if (statusBadge) {
                statusBadge.className = "status-pill listening";
                statusBadge.textContent = "🔴 Auto-Listening Active";
            }
            if (feedback) feedback.textContent = "Monitoring for distress cries: 'Bachao', 'Help'...";
            if (topbarBadge) {
                topbarBadge.style.display = "inline-flex";
                topbarBadge.textContent = "🎙️ Voice Guard: Active";
            }
        };

        voiceRecognition.onresult = function(event) {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                var transcript = event.results[i][0].transcript.toLowerCase();
                if (feedback) feedback.textContent = 'Heard: "' + transcript + '"';

                var distressKeywords = ["bachao", "help", "help me", "emergency", "safeher", "save me", "police", "attack", "danger"];
                var matched = distressKeywords.some(function(kw) {
                    return transcript.includes(kw);
                });

                if (matched) {
                    stopVoiceListening();
                    handleDistressVoiceTriggered(transcript);
                    return;
                }
            }
        };

        voiceRecognition.onerror = function(event) {
            console.warn("Voice guardian event:", event.error);
            if (event.error === "not-allowed") {
                if (statusBadge) {
                    statusBadge.className = "status-pill offline";
                    statusBadge.textContent = "⚪ Mic Permission Needed";
                }
            }
        };

        voiceRecognition.onend = function() {
            // Keep alive automatically in the background
            if (isVoiceListening && isAutoVoiceEnabled() && voiceRecognition) {
                try { voiceRecognition.start(); } catch (e) {}
            }
        };

        voiceRecognition.start();
    } catch (err) {
        console.warn("Speech recognition initialization error:", err);
    }
}

function stopVoiceListening() {
    isVoiceListening = false;
    var btn = document.getElementById("voiceToggleBtn");
    var statusBadge = document.getElementById("voiceStatusBadge");
    var feedback = document.getElementById("voiceTriggerFeedback");
    var topbarBadge = document.getElementById("topbarVoiceGuardBadge");

    if (btn) btn.textContent = "🎤 Resume Auto-Listening";
    if (statusBadge) {
        statusBadge.className = "status-pill offline";
        statusBadge.textContent = "⚪ Mic Paused";
    }
    if (feedback) feedback.textContent = 'Auto-Listening paused. Click Resume to re-enable.';
    if (topbarBadge) topbarBadge.style.display = "none";

    if (voiceRecognition) {
        try { voiceRecognition.stop(); } catch (e) {}
        voiceRecognition = null;
    }
}

// When distress word "Bachao" or "Help" is heard:
function handleDistressVoiceTriggered(phrase) {
    alert("🚨 [HANDS-FREE ACOUSTIC DISTRESS TRIGGERED!]\n\nSafeHer heard: '" + phrase + "'!\n\n⚡ Automatically executing Emergency Auto-Dial & Location Dispatch...");

    // 1. Immediately fire the wearable auto-call / 112 routine
    if (typeof simulateWearablePress === "function") {
        simulateWearablePress();
    } else {
        if (typeof startEmergencySiren === "function") startEmergencySiren();
        if (typeof activateEmergencySOS === "function") activateEmergencySOS();
    }
}

// Simulated test button for live hackathon presentation
function simulateVoiceDistress() {
    handleDistressVoiceTriggered("Bachao! Help me!");
}

// Auto-start on user interaction or page load
document.addEventListener("DOMContentLoaded", function() {
    var checkbox = document.getElementById("autoVoiceGuardianCheckbox");
    if (checkbox) {
        checkbox.checked = isAutoVoiceEnabled();
    }

    if (isAutoVoiceEnabled()) {
        // Start listening on first user interaction (browser security policy compliant)
        function startOnFirstGesture() {
            if (isAutoVoiceEnabled() && !isVoiceListening) {
                startVoiceListening();
            }
            window.removeEventListener("click", startOnFirstGesture);
            window.removeEventListener("keydown", startOnFirstGesture);
            window.removeEventListener("touchstart", startOnFirstGesture);
        }
        window.addEventListener("click", startOnFirstGesture);
        window.addEventListener("keydown", startOnFirstGesture);
        window.addEventListener("touchstart", startOnFirstGesture);

        // Also attempt direct start
        setTimeout(startVoiceListening, 1000);
    }
});