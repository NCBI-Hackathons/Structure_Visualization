from flask import Flask
from flask import render_template
app = Flask(__name__)


@app.route('/hello_world')
def hello_world():
    return 'Hello World!'


@app.route('/')
def home():
    return render_template('home.html')

if __name__ == '__main__':
    app.run()
