from flask import Flask, request, jsonify, render_template
import logging
import random
import re

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# Fungsi untuk memuat kata-kata berdasarkan level
def load_words(level):
    with open(f"words/{level}.txt", "r") as f:
        return f.read().strip().split(",")

# Store the current secret word and word list globally
SECRET_WORD = ""
word_list = []

@app.route('/')
def index():
    return render_template('index.html')  # Halaman utama yang menampilkan pilihan level

@app.route('/easy')
def easy():
    global SECRET_WORD, word_list
    level = 'easy'
    word_list = load_words(level)  # Load word list
    SECRET_WORD = random.choice(word_list).strip()
    SECRET_WORD = re.sub(r"[^\x00-\x7F']", '', SECRET_WORD)
    SECRET_WORD = SECRET_WORD.replace("'", "").upper()
    logging.debug(f"New SECRET_WORD for level {level}: {SECRET_WORD}")

    return render_template('easy.html', secret_word=SECRET_WORD, level=level)  # Pass word untuk level easy

@app.route('/medium')
def medium():
    global SECRET_WORD, word_list
    level = 'medium'
    word_list = load_words(level)  # Load word list
    SECRET_WORD = random.choice(word_list).strip()
    SECRET_WORD = re.sub(r"[^\x00-\x7F']", '', SECRET_WORD)
    SECRET_WORD = SECRET_WORD.replace("'", "").upper()
    logging.debug(f"New SECRET_WORD for level {level}: {SECRET_WORD}")

    return render_template('medium.html', secret_word=SECRET_WORD, level=level)  # Pass word untuk level medium

@app.route('/hard')
def hard():
    global SECRET_WORD, word_list
    level = 'hard'
    word_list = load_words(level)  # Load word list
    SECRET_WORD = random.choice(word_list).strip()
    SECRET_WORD = re.sub(r"[^\x00-\x7F']", '', SECRET_WORD)
    SECRET_WORD = SECRET_WORD.replace("'", "").upper()
    logging.debug(f"New SECRET_WORD for level {level}: {SECRET_WORD}")

    return render_template('hard.html', secret_word=SECRET_WORD, level=level)  # Pass word untuk level hard

@app.route('/new_word', methods=['GET'])
def new_word():
    global SECRET_WORD, word_list

    # Check if the word list is empty, if so, return an error
    if not word_list:
        return jsonify({"error": "No words loaded. Please select a level first."}), 400

    # Generate a new secret word from the list
    SECRET_WORD = random.choice(word_list).strip()
    SECRET_WORD = re.sub(r"[^\x00-\x7F']", '', SECRET_WORD)
    SECRET_WORD = SECRET_WORD.replace("'", "").upper()
    logging.debug(f"New SECRET_WORD: {SECRET_WORD}")

    return jsonify({"secret_word": SECRET_WORD})

@app.route('/check_word', methods=['POST'])
def check_word():
    try:
        data = request.get_json()
        logging.debug(f"Received data: {data}")
        guess = data.get('guess', '').upper()

        if not guess:
            return jsonify({"error": "Missing guess"}), 400

        if len(guess) != len(SECRET_WORD) or not guess.isalpha():
            return jsonify({"error": f"Invalid guess format. Must be {len(SECRET_WORD)} letters."}), 400

        result = []
        for i, letter in enumerate(guess):
            if letter == SECRET_WORD[i]:
                result.append('correct')
            elif letter in SECRET_WORD:
                result.append('present')
            else:
                result.append('absent')

        return jsonify({"result": result, "secret_word": SECRET_WORD})

    except Exception as e:
        logging.error(f"Error processing /check_word: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/list-easy')
def list_easy():
    return render_template('list-easy.html')  

@app.route('/list-medium')
def list_medium():
    return render_template('list-medium.html')  

@app.route('/list-hard')
def list_hard():
    return render_template('list-hard.html') 

if __name__ == "__main__":
    app.run(debug=True)
