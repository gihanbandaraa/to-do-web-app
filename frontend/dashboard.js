document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/frontend/login.html";
    } else {
        fetch("http://localhost:8000/get-user", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                window.location.href = "/frontend/login.html";
            }
        })
        .catch(error => {
            console.error("Error verifying token:", error);
            window.location.href = "/frontend/login.html";
        });

        fetchNotes();
    }

    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/frontend/login.html";
    });

    const addNoteButton = document.querySelector(".add-note-button");
    const modal = document.getElementById("note-modal");
    const closeButton = document.querySelector(".close-button");

    addNoteButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    const addNoteForm = document.getElementById("add-note-form");
    addNoteForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = document.getElementById("note-title").value;
        const content = document.getElementById("note-content").value;
        const tags = document.getElementById("note-tags").value.split(',').map(tag => tag.trim());

        const requestBody = {
            title,
            content,
            tags,
        };

        try {
            const response = await fetch("http://localhost:8000/add-note", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note added successfully");
                modal.style.display = "none";
                fetchNotes();  // Reload notes
            } else {
                alert(result.message || "Failed to add note");
            }
        } catch (error) {
            console.error("Error adding note:", error);
            alert("An error occurred. Please try again later.");
        }
    });

    const searchInput = document.querySelector(".search");
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim(); // Get the search query
        if (query !== "") {
            searchNotes(query); // Call function to search notes
        } else {
            fetchNotes(); // If query is empty, fetch all notes
        }
    });

    function searchNotes(query) {
        fetch(`http://localhost:8000/search-notes/?query=${query}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.message || "Failed to search notes");
                return;
            }

            const notesContainer = document.querySelector(".notes-container");
            notesContainer.innerHTML = ""; // Clear previous notes

            data.notes.forEach(note => {
                const noteElement = document.createElement("div");
                noteElement.classList.add("note");

                const noteTitle = document.createElement("h3");
                noteTitle.textContent = note.title;

                const noteContent = document.createElement("p");
                noteContent.textContent = note.content;

                const noteTags = document.createElement("p");
                noteTags.textContent = "Tags: " + note.tags.join(", ");

                noteElement.appendChild(noteTitle);
                noteElement.appendChild(noteContent);
                noteElement.appendChild(noteTags);

                notesContainer.appendChild(noteElement);
            });
        })
        .catch(error => {
            console.error("Error searching notes:", error);
            alert("An error occurred. Please try again later.");
        });
    }

 // Fetch notes and display them in the respective containers
function fetchNotes() {
    fetch("http://localhost:8000/get-all-notes", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.message || "Failed to fetch notes");
            return;
        }

        const pinnedNotesContainer = document.querySelector(".pinned-notes-container");
        const regularNotesContainer = document.querySelector(".regular-notes-container");

        pinnedNotesContainer.innerHTML = "";
        regularNotesContainer.innerHTML = "";

        data.notes.forEach(note => {
            const noteElement = createNoteElement(note);
            if (note.isPinned) {
                pinnedNotesContainer.appendChild(noteElement);
            } else {
                regularNotesContainer.appendChild(noteElement);
            }
        });
    })
    .catch(error => {
        console.error("Error fetching notes:", error);
        alert("An error occurred. Please try again later.");
    });
}


function createNoteElement(note) {
    const noteElement = document.createElement("div");
    noteElement.classList.add("note");

    const noteTitle = document.createElement("h3");
    noteTitle.textContent = note.title;

    const noteContent = document.createElement("p");
    noteContent.textContent = note.content;

    const noteTags = document.createElement("p");
    noteTags.textContent = "Tags: " + note.tags.join(", ");

    const pinButton = document.createElement("button");
    pinButton.textContent = note.isPinned ? "Unpin" : "Pin";
    pinButton.addEventListener("click", () => togglePin(note._id, !note.isPinned));

    noteElement.appendChild(noteTitle);
    noteElement.appendChild(noteContent);
    noteElement.appendChild(noteTags);
    noteElement.appendChild(pinButton);

    return noteElement;
}


function togglePin(noteId, isPinned) {
    fetch(`http://localhost:8000/update-note-pinned/${noteId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isPinned }),
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(result.message || "Failed to update pin status");
        } else {
            fetchNotes();  // Reload notes to reflect changes
            const searchInput = document.querySelector(".search");
            if (searchInput.value.trim() !== "") {
                searchNotes(searchInput.value.trim()); // If there's an active search, re-run the search
            }
        }
    })
    .catch(error => {
        console.error("Error updating pin status:", error);
        alert("An error occurred. Please try again later.");
    });

}
});
