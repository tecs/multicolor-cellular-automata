const dec = (x, max) => x - 1 < 0 ? max : x - 1;
const inc = (x, max) => x + 1 < max ? x + 1 : 0;

const trinaryProduct = (left, center, right, colors) => {

    let number = center;
    let action = 1; // Decrement one

    if (left < center && center < right)
    {
        number = left;
    }
    else if (left > center && center > right)
    {
        number = right;
    }
    else if (left > center && center < right) // Pass
    {
        number = center;
        action = 2;
    }
    else if (left < center && center === right)
    {
        number = right;
        action = 2;
    }
    else if (left === center && center > right)
    {
        number = left;
        action = 2;
    }
    else if (left < center && center > right) // Increment one
    {
        action = 3;
    }
    else if (left > center && center === right)
    {
        number = right;
        action = 3;
    }
    else if (left === center && center < right)
    {
        number = left;
        action = 3;
    }
    
    if (action === 1) {
        return dec(number, colors);
    } else if (action === 2) {
        return number;
    }

    return inc(number, colors);
};

const getColor = (colors, dots, offset, passes) => {
    if (!dots.length) {
        return Math.round(Math.random() * colors);
    }

    const product = [
        offset ? dots[offset - 1] : dots[dots.length - 1],
        dots[offset],
        offset + 1 < dots.length ? dots[offset + 1] : dots[0]
    ];
    while (passes--) {
        product.push(trinaryProduct(...product.slice(-3), colors));
    }
    return product.slice(-1);
};

const similarColor = (color, deviation) => {
    return color.map((value, index) => {
        const dir = Math.random(-Math.round())
        if (index === 2) {
            return value + deviation*dir;
        }
        let vDev = Math.round(Math.random()*deviation) * dir;
        if (value + vDev < 0) {
            vDev = -value;
        } else if (value + vDev > 255) {
            vDev = 255 - value;
        }
        deviation -= vDev;
        return value + vDev; 
    });
};

const generateColors = number => {
    const colors = [];
    while (colors.length < number) {
        const previous = colors.length ? colors[colors.length - 1] : [0,0,0].map(() => 127 + Math.round(Math.random()*50));
        colors.push(similarColor(previous, 255/number));
    }
    return colors.sort((a, b) => (a[0]-b[0]) + (a[1]-b[1]) + (a[2]-b[2]) + ((a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])));
};

const config = {
    bpm: 120,
    numColors: 2,
    pixel: 10,
    passes: 1,
    width: 1,
    height: 1,
    context: null
};

window.onresize = () => {
    const canvas = document.getElementById('screen');
    canvas.width = config.width = window.innerWidth;
    canvas.height = config.height = window.innerHeight;
};

window.onload = () => {
    const canvas = document.getElementById('screen');
    window.onresize();
    config.context = canvas.getContext('2d');
    draw();
};
const draw = () => {
    const pixel = config.pixel;
    const start = (new Date()).getTime();
    const colors = generateColors(config.numColors).map(data => {
        const dataOut = [];
        for (let i=0; i<pixel*pixel; ++i) {
            dataOut.push(data[0], data[1], data[2], 255)
        }
        return new ImageData(new Uint8ClampedArray(dataOut), pixel, pixel)
    });

    let h = 0;
    let hLeft = config.height;
    let matrix = [];

    setTimeout(function forH() {
        let w = 0;
        const previous = matrix.slice(-config.width);
        for (let w=0; w<config.width; ++w) {
            const color = getColor(colors.length - 1, previous, w, config.passes);
            
            matrix[h*config.width + w] = color;
            config.context.putImageData(colors[color], w*pixel, h*pixel);
        }
        hLeft -= pixel;
        h++;
        if (hLeft > 0) {
            setTimeout(forH, 0);
        } else {
            const elapsed = (new Date()).getTime() - start;
            const beat = (60*1000) / config.bpm;
            let nextBeat = beat - elapsed;
            while (nextBeat < 0) {
                nextBeat += beat;
            }
            
            setTimeout(draw, nextBeat);
        }
    }, 0);
};

let timings = [];
window.onclick = () => {
    timings.push((new Date()).getTime());
    if (timings.length === 4) {
        config.bpm = Math.round((60*1000) / ((timings[3] - timings[0]) / 3));
        timings.splice(0, 1);
    }
}

let wheeling = false;
window.onmousewheel = (e) => {
    if (wheeling) {
        return;
    }
    wheeling = true;
    const dir = e.deltaY > 0 ? -1 : 1;

    if (e.clientX < config.width/2 && e.clientY < config.height/2) {
        let newPixel = config.pixel + dir;
        if (newPixel <= config.width && newPixel <= config.height && newPixel >= 1) {
            config.pixel = newPixel;
        }
    } else if (e.clientX < config.width/2 && e.clientY >= config.height/2) {
        if (config.passes + dir >= 1) {
            config.passes += dir;
        }
    } else if (config.numColors + dir >= 2 && config.numColors + dir <= 255) {
        config.numColors += dir;
    }
    wheeling = false;
}