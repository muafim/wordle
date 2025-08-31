let currentRow = 0;
let currentCol = 0;

// Get the game level from the body class, which we passed from the backend
const level = document.body.classList.contains('easy') ? 'easy' :
              document.body.classList.contains('medium') ? 'medium' : 'hard';

// Set the number of columns based on the level
const maxCols = level === "easy" ? 4 : level === "medium" ? 6 : 8;
const maxRows = level === "easy" ? 4 : level === "medium" ? 6 : 8;  // The maximum number of rows remains the same

const rows = document.querySelectorAll(".letter-row");
const keys = document.querySelectorAll(".keyboard-button");

// Fungsi untuk memasukkan huruf ke dalam kotak
function insertLetter(letter) {
    console.log(`Inserting letter: ${letter}`); // Debugging
    if (currentCol < maxCols && currentRow < maxRows) {
        const letterBox = rows[currentRow].children[currentCol];
        letterBox.textContent = letter.toUpperCase();
        letterBox.classList.add("filled-letter");
        currentCol++;
    }
}

// Fungsi untuk menghapus huruf (untuk tombol "Del")
function deleteLetter() {
    console.log("Deleting letter"); // Debugging
    if (currentCol > 0 && currentRow < maxRows) {
        currentCol--;
        const letterBox = rows[currentRow].children[currentCol];
        letterBox.textContent = "";
        letterBox.classList.remove("filled-letter");
    }
}



// Fungsi untuk mengirim jawaban (untuk tombol "Enter")
function submitWord() {
    if (currentCol === maxCols) {
        const guess = getWord();
        const payload = { guess: guess };
        console.log("Submitting guess:", payload); // Debugging

        fetch('/check_word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data:", data); // Debugging
            if (data.error) {
                toastr.error(data.error);
                return;
            }

            const result = data.result; // Array hasil validasi
            const rowTiles = rows[currentRow].children;

            for (let i = 0; i < maxCols; i++) {
                const letterBox = rowTiles[i];
                const letter = letterBox.textContent;
                letterBox.classList.remove("filled-letter");

                if (result[i] === 'correct') {
                    letterBox.classList.add("correct-letter");
                    updateKeyboard(letter, 'correct');
                } else if (result[i] === 'present') {
                    letterBox.classList.add("present-letter");
                    updateKeyboard(letter, 'present');
                } else {
                    letterBox.classList.add("absent-letter");
                    updateKeyboard(letter, 'absent');
                }
            }

            // Cek kondisi menang atau lanjut ke baris berikutnya
            if (result.every(status => status === 'correct')) {
                setTimeout(() => {
                    Swal.fire({ title: "Congratulations!", text: "You've guessed the word!", icon: "success", timer: 2500 });
                }, 300);
                disableInput();
            } else if (currentRow < maxRows - 1) {
                currentRow++;
                currentCol = 0;
            } else {
                setTimeout(() => {
                    Swal.fire({ title: "Game Over!", text: `The word was: ${data.secret_word}`, icon: "error", timer: 3000 });
                }, 300);
                disableInput();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({ title: "Error", text: "An error occurred while checking the word.", icon: "error", timer: 2000 });
        });
    } else {
        setTimeout(() => {
            Swal.fire({ title: "Invalid Attempt", text: `Word must be ${levelSettings[currentLevel]} letters long!`, icon: "warning", timer: 2500 });
        }, 300);
    }
}

// Fungsi untuk mengambil kata yang telah diisi
function getWord() {
    let word = "";
    for (let i = 0; i < maxCols; i++) {
        word += rows[currentRow].children[i].textContent;
    }
    return word;
}

// Fungsi untuk menonaktifkan input setelah game selesai
function disableInput() {
    keys.forEach(key => {
        key.disabled = true;
    });
}

// Fungsi untuk memperbarui keyboard berdasarkan status huruf
function updateKeyboard(letter, status) {
    const keyButtons = Array.from(keys).filter(key => key.textContent.toUpperCase() === letter);
    keyButtons.forEach(key => {
        if (status === 'correct') {
            key.classList.remove('present-letter', 'absent-letter');
            key.classList.add('correct-letter');
        } else if (status === 'present') {
            if (!key.classList.contains('correct-letter')) {
                key.classList.remove('absent-letter');
                key.classList.add('present-letter');
            }
        } else if (status === 'absent') {
            if (!key.classList.contains('correct-letter') && !key.classList.contains('present-letter')) {
                key.classList.add('absent-letter');
            }
        }
    });
}

function resetGame() {
    // Fetch a new secret word from the server
    fetch('/new_word')
        .then(response => response.json())
        .then(data => {
            console.log("New secret word received:", data.secret_word); // Debugging

            // Clear all letter boxes
            rows.forEach(row => {
                Array.from(row.children).forEach(letterBox => {
                    letterBox.textContent = "";
                    letterBox.classList.remove("filled-letter", "correct-letter", "present-letter", "absent-letter");
                });
            });

            // Reset game state variables
            currentRow = 0;
            currentCol = 0;

            // Re-enable keyboard input
            keys.forEach(key => {
                key.disabled = false;
                key.classList.remove('correct-letter', 'present-letter', 'absent-letter');
            });

            toastr.success("Game reset");
        })
        .catch(error => {
            console.error('Error fetching new secret word:', error);
            toastr.error("Failed to reset the game. Please try again.");
            // Optionally disable game input or reset UI if the error persists
            disableInput();
        });        
}

// Reload button click event
document.getElementById('reload-img').addEventListener('click', function() {
    resetGame();
});

let audio = null; // Declare audio object globally

document.addEventListener('DOMContentLoaded', function() {
    // Check if the audio is already created
    if (!audio) {
        // Create a new Audio object and play the audio
        audio = new Audio('static/asset/bsd.mp3');
        audio.loop = true; // Set it to loop if needed
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }
});

// Function to handle level change (like switching between easy, medium, or hard)
function changeLevel(newLevel) {
    // Pause audio when changing the level
    if (audio) {
        audio.pause();
    }

    // Change level logic...
    // After the level is changed, resume the audio if needed.
    if (audio) {
        audio.currentTime = 0; // Optionally reset audio to the beginning, if desired
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }
}

//Tombol keyboard input
keys.forEach(key => {
    key.addEventListener('click', () => {
        const keyValue = key.textContent.toUpperCase();
        console.log(`Key clicked: ${keyValue}`); // Debugging

        if (keyValue === "DEL") {
            deleteLetter();
        } else if (keyValue === "ENTER") {
            submitWord();
        } else if (/^[A-Z]$/.test(keyValue)) {
            insertLetter(keyValue);
        }
    });
});

// Keyboard fisik input
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();
    console.log(`Key pressed: ${key}`); // Debugging

    if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (key === 'ENTER') {
        submitWord();
    } else if (/^[A-Z]$/.test(key)) {
        insertLetter(key);
    }
});


