import cv2
import collections
import numpy as np

OPENCV_MAJOR_VERSION = int(cv2.__version__.split('.')[0])

bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)

erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

PTS_MAX = 25
pts = collections.deque(maxlen=PTS_MAX)

cap = cv2.VideoCapture(0)
success, frame = cap.read()
while success:

    fg_mask = bg_subtractor.apply(frame)

    _, thresh = cv2.threshold(fg_mask, 244, 255, cv2.THRESH_BINARY)
    cv2.erode(thresh, erode_kernel, thresh, iterations=2)
    cv2.dilate(thresh, dilate_kernel, thresh, iterations=2)

    if OPENCV_MAJOR_VERSION >= 4:
        # OpenCV 4 or a later version is being used.
        contours, hier = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                          cv2.CHAIN_APPROX_SIMPLE)
    else:
        # OpenCV 3 or an earlier version is being used.
        # cv2.findContours has an extra return value.
        # The extra return value is the thresholded image, which is
        # unchanged, so we can ignore it.
        _, contours, hier = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                             cv2.CHAIN_APPROX_SIMPLE)

    filtered_contours = list(filter(lambda c: (cv2.contourArea(c)<100000), contours)) 
    # filtered_contours = contours
    if len(filtered_contours) > 0:
        c = max(filtered_contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(c)
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
        M = cv2.moments(c)
        center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
        cv2.circle(frame, center, 5, (0, 0, 255), -1)
        pts.appendleft(center)
        for i in np.arange(1, len(pts)):
            thickness = int(np.sqrt(PTS_MAX / float(i + 1)) * 2.5)
            cv2.line(frame, pts[i - 1], pts[i], (0, 0, 255), thickness)


    for c in contours:
        if cv2.contourArea(c) < 100000:
            x, y, w, h = cv2.boundingRect(c)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 0), 2)


    cv2.imshow('mog', fg_mask)
    cv2.imshow('thresh', thresh)
    cv2.imshow('detection', frame)

    k = cv2.waitKey(30)
    if k == 27:  # Escape
        break

    success, frame = cap.read()
