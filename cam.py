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

class Camera(object):
    def __init__(self, url, logger): 
        self.url = url
        self.half_period = []
        self.pts = []
        self.logger = logger
        # self.cap = cv2.VideoCapture(url)
    def get_period(self):
        return self.half_period
    def get_points(self):
        return self.pts
    def gen_frames(self):
        """Generate frame by OpenCV from video soure by camera id"""

        def drawText(text: str,
                    color: Tuple[int, int, int],
                    pos: Tuple[int, int],
                    big=False,
                    console=False):
            if console:
                print(text)

            if big:
                scale = 1
                thickness = 4
            else:
                scale = 0.6
                thickness = 2
            cv2.putText(frame, str(text), org=pos, fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=scale, color=color, thickness=3)

        bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

        time_start = time.time()
        time_state_change = time.time()
        cap = cv2.VideoCapture(self.url)
        success, frame = cap.read()  # read the camera frame
        pts_max = 25
        rebase_count = 0
        rebase_max = 20
        period_half_max_len = 20
        is_left2right = False
        period_half = collections.deque(maxlen = period_half_max_len)
        pts = collections.deque(maxlen=pts_max)
        while True:
            # for cap in caps:
            # # Capture frame-by-frame
            if not success:
                break
            else:
                # ret, buffer = cv2.imencode('.jpg', frame)

                fg_mask = bg_subtractor.apply(frame)
                _, thresh = cv2.threshold(fg_mask, 244, 255, cv2.THRESH_BINARY)
                cv2.erode(thresh, erode_kernel, thresh, iterations=2)
                cv2.dilate(thresh, dilate_kernel, thresh, iterations=2)
                time_total = round(time.time() - time_start, 2)
                contours, hier = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                                cv2.CHAIN_APPROX_SIMPLE)
                filtered_contours = list(filter(lambda c: (cv2.contourArea(c)>1500 and cv2.contourArea(c)<200000), contours)) 
                if len(filtered_contours) > 0:
                    c = max(filtered_contours, key=cv2.contourArea)
                    x, y, w, h = cv2.boundingRect(c)
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                    M = cv2.moments(c)
                    center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
                    cv2.circle(frame, center, 5, (0, 0, 255), -1)
                    if (len(pts) < pts_max):
                        pts.appendleft(center)
                    else:
                        # filter out all moments bigger than 100 px in y axis
                        if (abs(center[1]-pts[0][1]) < 100 ): 
                            rebase_count = 0
                            # If the difference is positive then left2right should be true
                            # if false, the state is changed and 
                            if (center[0]-pts[0][0] > 0 and is_left2right == False): 
                                temp_period_half = time.time() - time_state_change
                                # anything less than 0.3s is too small
                                if (temp_period_half > 0.3):
                                    period_half.appendleft(temp_period_half)
                                    time_state_change = time.time()
                                    is_left2right = True
                                    drawText("Period " + str(temp_period_half), (0, 255, 0), (320, 320))
                            elif (center[0]-pts[0][0] < 0 and is_left2right == True): 
                                temp_period_half = time.time() - time_state_change
                                if (temp_period_half > 0.3):
                                    period_half.appendleft(temp_period_half)
                                    time_state_change = time.time()
                                    is_left2right = False
                                    drawText("Period " + str(temp_period_half), (0, 255, 0), (320, 320))
                            pts.appendleft(center)
                        else: 
                            rebase_count += 1
                            if (rebase_count > rebase_max):
                                pts.clear()
                    # gaussian_filter(pts, sigma = 1)
                    # loop over the set of tracked points
                    # add tail for center point
                    for i in np.arange(1, len(pts)):
                        thickness = int(np.sqrt(pts_max / float(i + 1)) * 2.5)
                        cv2.line(frame, pts[i - 1], pts[i], (0, 0, 255), thickness)
                    self.half_period = period_half
                    self.pts = pts


                # for c in contours:
                #     if cv2.contourArea(c) > 1000:
                #         x, y, w, h = cv2.boundingRect(c)
                #         cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 0), 2)
                #         cv2.drawContours(frame, c, 0, (0,255,0), 2)
                drawText(f"total: {time_total}", (0, 255, 0), (120, 40))

                ret, buffer = cv2.imencode('.jpg', frame)
                framebytes = buffer.tobytes()
                yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + framebytes + b'\r\n')
                success, frame = cap.read()
                # concat frame one by one and show result