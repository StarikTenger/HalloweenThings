
const fs = require('fs');
const Canvas = require('canvas')
const path = require("path")
const readdirdeep = require("../scripts/utils/readdirdeep")
const atlaspack = require('atlaspack')

const destination = path.resolve(__dirname, "../build/textures")

global.Image = Canvas.Image

let size = 512;

let canvas = Canvas.createCanvas(size, size);
let ctx = canvas.getContext('2d');
let atlas = atlaspack(canvas);

atlas.tilepad = true

let i = 0;
let images = [];
const json = {};

readdirdeep("./source").then((list) => {
	for(let file of list) {
		if(!file.endsWith(".png")) {
			continue
		}

		const img = new Image();
	    img.id = String(i++);

		img.onload = function() {

	        const l = file.split(".");
	        l.pop()

			images.push([l.join("."), img])
		};

		img.src = path.resolve(__dirname, 'source', file)
	}

	images = images.sort(function(img1, img2) {
		return img1[1].width * img1[1].height - img2[1].width * img2[1].height
	})

	console.log("Finished reading images")

	for (let i = images.length - 1; i >= 0; i--) {
		let img = images[i]

		let scale = 1

		console.log("Writing image " + img[0])

		const atl = atlas.pack({width: img[1].width * scale + 2, height: img[1].height * scale + 2});
		atlas.tilepad = true

		if(!atl.rect) {
			console.log("Failed to write image " + img[0])
			break
		}

		json[img[0].replace(/\\/g, "/")] = {
			x: (atl.rect.x + 1),
			y: (atl.rect.y + 1),
			w: (atl.rect.w - 2),
			h: (atl.rect.h - 2)
		}

		ctx.drawImage(img[1], atl.rect.x + 1, atl.rect.y + 1, atl.rect.w - 2, atl.rect.h - 2)
		// Left
		ctx.drawImage(canvas, atl.rect.x + 1, atl.rect.y + 1, 1, atl.rect.h - 2, atl.rect.x, atl.rect.y + 1, 1, atl.rect.h - 2)
		// Right
		ctx.drawImage(canvas, atl.rect.x + atl.rect.w - 2, atl.rect.y + 1, 1, atl.rect.h - 2, atl.rect.x + atl.rect.w - 1, atl.rect.y + 1, 1, atl.rect.h - 2)
		// Top
		ctx.drawImage(canvas, atl.rect.x + 1, atl.rect.y + 1, atl.rect.w - 2, 1, atl.rect.x + 1, atl.rect.y, atl.rect.w - 2, 1)
		// Bottom
		ctx.drawImage(canvas, atl.rect.x + 1, atl.rect.y + atl.rect.h - 2, atl.rect.w - 2, 1, atl.rect.x + 1, atl.rect.y + atl.rect.h - 1, atl.rect.w - 2, 1)

		// Left-top
		ctx.drawImage(canvas, atl.rect.x + 1, atl.rect.y + 1, 1, 1, atl.rect.x, atl.rect.y, 1, 1)
		// Right-top
		ctx.drawImage(canvas, atl.rect.x + atl.rect.w - 2, atl.rect.y + 1, 1, 1, atl.rect.x + atl.rect.w - 1, atl.rect.y, 1, 1)
		// Left-bottom
		ctx.drawImage(canvas, atl.rect.x + 1, atl.rect.y + atl.rect.h - 2, 1, 1, atl.rect.x, atl.rect.y + atl.rect.h - 1, 1, 1)
		// Right-bottom
		ctx.drawImage(canvas, atl.rect.x + atl.rect.w - 2, atl.rect.y + atl.rect.h - 2, 1, 1, atl.rect.x + atl.rect.w - 1, atl.rect.y + atl.rect.h - 1, 1, 1)

	}

	let atlasPath = path.resolve(destination, "atlas.png")
	let jsonPath = path.resolve(destination, "atlas.json")

	try { fs.accessSync(path.dirname(atlasPath)) }
	catch(err) { fs.mkdirSync(path.dirname(atlasPath)) }

	try { fs.accessSync(path.dirname(jsonPath)) }
	catch(err) { fs.mkdirSync(path.dirname(jsonPath)) }

	fs.writeFileSync(atlasPath, canvas.toBuffer());
	fs.writeFileSync(jsonPath, JSON.stringify(json));
});