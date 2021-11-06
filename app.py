from flask import Flask, render_template, Response, jsonify
from typing import Tuple
import cv2
import time
import threading
import queue
import collections
import numpy as np
from statistics import mean, stdev
from scipy.ndimage import gaussian_filter
from cam import Camera as MainCamera

app = Flask(__name__, static_url_path='', static_folder='static')

# main_cam_url = "rtsp://192.168.137.161:8554/unicast"
main_cam_url = 0

main_cam = MainCamera(main_cam_url, app.logger)
# alt_cam = AltCamera(alt_cam_url)

@app.route("/period")
def get_period():
    return jsonify({
            "period": list(main_cam.get_period())
        })

@app.route("/points")
def get_points():
    return jsonify({
            "points": list(main_cam.get_points())
        })

@app.route('/video_feed/<string:id>/', methods=["GET"])
def video_feed(id):
    """Video streaming route. Put this in the src attribute of an img tag."""
    if int(id) == 0:
        return Response(main_cam.gen_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/', methods=["GET"])
def index():
    """Render"""
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
