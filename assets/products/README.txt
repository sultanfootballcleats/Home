HOW TO ADD PHOTOS & VIDEOS FOR EACH PAIR
========================================

Every product has an ID like p118 (matches the product's ID in js/main.js).

PHOTOS — MULTIPLE ANGLES
-------------------------
1. Put the photos in this folder: assets/products/
2. In that product's entry in js/main.js, add an images list:

    image: 'assets/products/p118.jpg',
    images: [
      'assets/products/p118.jpg',
      'assets/products/p118-2.jpg',
      'assets/products/p118-3.jpg',
      'assets/products/p118-4.jpg',
    ],

The first photo is the main/default image. Customers see small thumbnails
under the main image and can click each one to view the shoe from that angle.

You can use any number of photos. Good angles are:
  - left side
  - right side
  - top
  - sole/studs
  - heel
  - close-up of labels or any wear/faults

VIDEO — OPTIONAL
-----------------
1. Put the video in assets/products/, for example:
      p118.mp4
2. In the same product entry, set:
      video: 'assets/products/p118.mp4',

A Video thumbnail appears underneath the photos on that product's page.
When the customer clicks it, the video opens in the large main gallery area
with playback controls.

IMAGE SIZING
------------
Square-ish or portrait product photos work best. The product gallery now uses
a 4:5 display area and object-fit: contain so the whole shoe is visible
without being cropped. The shop grid card uses a square (1:1) box and crops
photos slightly to fill it — so for the cleanest look on the shop page, frame
each photo with the boot filling most of the frame and roughly centered
(rather than a small boot in the middle of a lot of empty floor/background).
Shooting all your photos the same way — same distance, same background,
boot filling ~80-90% of the frame — is what makes the shop grid look most
consistent, since the site can't automatically re-crop each photo differently.

KEEPING FILE SIZES SMALL
------------------------
Smaller files mean the site loads fast on a customer's mobile data. Aim for:

  Photos: about 1000-1500px on the longest side, saved as JPG,
          ideally under 300KB each. Most phone camera photos come out much
          bigger than this (several MB) — resize before uploading using:
            - your phone's built-in editor (crop/resize then re-save), or
            - a free site like squoosh.app (drag the photo in, it resizes
              and compresses right in the browser, then download)

  Videos: keep clips short (5-10 seconds is plenty to show a pair turning),
          resolution 720p is enough, and aim for under ~8MB. Most phones
          let you pick a lower resolution/quality when exporting or sharing
          a video — choose "Medium" or "720p" rather than the original 4K.
          Free tools like Handbrake (desktop) or CloudConvert.com can also
          shrink a video file if it's still too large.

If a photo or video is too large, the page will still work — it will just
take longer to open, especially for customers on mobile data.
