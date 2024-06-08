document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/frontend/login.html";
  } else {
    fetch("http://localhost:8000/get-user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          window.location.href = "/frontend/login.html";
        }
      })
      .catch((error) => {
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
    const tags = document
      .getElementById("note-tags")
      .value.split(",")
      .map((tag) => tag.trim());

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Note added successfully");
        modal.style.display = "none";
        fetchNotes(); // Reload notes
      } else {
        alert(result.message || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      alert("An error occurred. Please try again later.");
    }
  });

  const searchIcon = document.getElementById("searchicon");
  searchIcon.addEventListener("click", () => {
    const query = document.querySelector(".search").value.trim();
    if (query !== "") {
      searchNotes(query);
    } else {
      fetchNotes(); // Reload notes when the search query is empty
    }
  });

  function searchNotes(query) {
    fetch(`http://localhost:8000/search-notes/?query=${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.message || "Failed to search notes");
          return;
        }

        const notesContainer = document.querySelector(".notes-container");
        notesContainer.innerHTML = ""; // Clear previous notes

        data.notes.forEach((note) => {
          const noteElement = createNoteElement(note);
          notesContainer.appendChild(noteElement);
        });
      })
      .catch((error) => {
        console.error("Error searching notes:", error);
        alert("An error occurred. Please try again later.");
      });
  }

  // Fetch notes and display them in the respective containers
  function fetchNotes() {
    fetch("http://localhost:8000/get-all-notes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.message || "Failed to fetch notes");
          return;
        }

        const pinnedNotesContainer = document.querySelector(
          ".pinned-notes-container"
        );
        const regularNotesContainer = document.querySelector(
          ".regular-notes-container"
        );

        pinnedNotesContainer.innerHTML = "";
        regularNotesContainer.innerHTML = "";

        data.notes.forEach((note) => {
          const noteElement = createNoteElement(note);
          if (note.isPinned) {
            pinnedNotesContainer.appendChild(noteElement);
          } else {
            regularNotesContainer.appendChild(noteElement);
          }
        });
      })
      .catch((error) => {
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
    noteTags.textContent = "#" + note.tags.join(", ");

    const pinIcon = document.createElement("img");
    pinIcon.src = note.isPinned
      ? "./Images/pinned.png"
      : "./Images/unpinned.png";
    pinIcon.classList.add("pin-icon");
    pinIcon.alt = note.isPinned ? "Unpin" : "Pin";
    pinIcon.addEventListener("click", () =>
      togglePin(note._id, !note.isPinned)
    );

    const editIcon = document.createElement("img");
    editIcon.src = "./Images/drawing.png";
    editIcon.classList.add("edit-icon");
    editIcon.alt = "Edit";
    editIcon.addEventListener("click", () => editNoteHandler(note._id));

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "./Images/bin.png";
    deleteIcon.classList.add("delete-icon");
    deleteIcon.alt = "Delete";
    deleteIcon.addEventListener("click", () => deleteNoteHandler(note._id));

    noteElement.appendChild(noteTitle);
    noteElement.appendChild(pinIcon);
    noteElement.appendChild(noteContent);
    noteElement.appendChild(noteTags);
    noteElement.appendChild(deleteIcon);
    noteElement.appendChild(editIcon);

    return noteElement;
  }

  function togglePin(noteId, isPinned) {
    fetch(`http://localhost:8000/update-note-pinned/${noteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isPinned }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          alert(result.message || "Failed to update pin status");
        } else {
          fetchNotes(); // Reload notes to reflect changes
        }
      })
      .catch((error) => {
        console.error("Error updating pin status:", error);
        alert("An error occurred. Please try again later.");
      });
  }

  function deleteNoteHandler(noteId) {
    if (confirm("Are you sure you want to delete this note?")) {
      fetch(`http://localhost:8000/delete-note/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            alert(result.message || "Failed to delete note");
          } else {
            fetchNotes(); // Reload notes after deletion
          }
        })
        .catch((error) => {
          console.error("Error deleting note:", error);
          alert("An error occurred. Please try again later.");
        });
    }
  }

  function editNoteHandler(noteId) {
    // Fetch note data from the server using noteId
    fetch(`http://localhost:8000/notes/${noteId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch note data");
        }
        return response.json();
      })
      .then((noteData) => {
        console.log("Fetched note data:", noteData); // Debug

        // Display a modal or form with existing note data populated
        const editModal = document.getElementById("edit-modal");
        const titleInput = document.getElementById("edit-note-title");
        const contentInput = document.getElementById("edit-note-content");
        const tagsInput = document.getElementById("edit-note-tags");

        console.log("Elements:", titleInput, contentInput, tagsInput); // Debug

        // Populate the form fields with existing note data
        if (titleInput && contentInput && tagsInput) {
          titleInput.value = noteData.note.title;
          contentInput.value = noteData.note.content;
          tagsInput.value = noteData.note.tags.join(", ");
        } else {
          console.error("One or more input elements not found."); // Debug
        }

        // Display the modal
        editModal.style.display = "block";

        // Add event listener to the form submit button
        const editForm = document.getElementById("edit-note-form");
        editForm.addEventListener("submit", async (event) => {
          event.preventDefault();

          // Get updated values from the form fields
          const updatedTitle = titleInput.value;
          const updatedContent = contentInput.value;
          const updatedTags = tagsInput.value
            .split(",")
            .map((tag) => tag.trim());

          // Prepare request body with updated data
          const requestBody = {
            title: updatedTitle,
            content: updatedContent,
            tags: updatedTags,
          };

          console.log("Sending update request with data:", requestBody); // Debug

          try {
            // Send a PUT request to update the note
            const response = await fetch(
              `http://localhost:8000/edit-note/${noteId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
              }
            );

            const result = await response.json();

            console.log("Update response:", result); // Debug

            if (response.ok) {
              alert("Note updated successfully");
              editModal.style.display = "none";
              fetchNotes(); // Reload notes
            } else {
              alert(result.message || "Failed to update note");
            }
          } catch (error) {
            console.error("Error updating note:", error);
            alert("An error occurred. Please try again later.");
          }
        });
      })
      .catch((error) => {
        console.error("Error fetching note data:", error);
        alert("An error occurred. Please try again later.");
      });
  }
});
