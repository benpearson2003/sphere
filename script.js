var tau = 6.283;
var seaColor = "rgb(0,128,255)";
var landColor = "rgb(0,153,0)";
var borderColor = "rgb(0,0,0)";
var radius = 40;
var canvas,
    ctx,
    depth = 6,
    moreDetail = false,
    cullError = 40;
var sphere = new Sphere3D(radius),
    distance = 5000,
    mouse = {
        down: false,
        button: 1,
        x: 0,
        y: 0,
        px: 0,
        py: 0
    },
    modify = 1;



window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };

function normalize(p) {
    s = Math.sqrt((p.x*p.x) + (p.y*p.y) + (p.z*p.z));
    point = new Point3D();
    point.x = (p.x/s)*radius; point.y = (p.y/s)*radius; point.z = (p.z/s)*radius;
    point.elevation = p.elevation;
    //point.elevation = p.elevation * getRandomArbitrary(0.90,1.1);
    return point;
}

function midpoint(u,v) {
    point = new Point3D();
    point.x = (u.x+v.x)/2;
    point.y = (u.y+v.y)/2;
    point.z = (u.z+v.z)/2;
    point.elevation = (u.elevation+v.elevation)/2;
    return point;
}

function Point3D() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.elevation = 0;
}

function Face3D(a,b,c,elevation) {
    // a, b, and c are Point3D
    this.a = a;
    this.b = b;
    this.c = c;
    this.elevation = elevation;
}

function Sphere3D(radius) {
    this.point = new Array();
    this.triangle = new Array();
    this.color = "rgb(100,255,0)";
    this.radius = (typeof(radius) != "number") ? 20.0 : radius;

    var tempTriangle = [];

    var octoVerts = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1]
    ];

    var octoFaces = [
        [0, 2, 4],
        [0, 4, 3],
        [0, 3, 5],
        [0, 5, 2],
        [1, 2, 5],
        [1, 5, 3],
        [1, 3, 4],
        [1, 4, 2]
    ];

    // octahedron
    for(let i = 0; i < octoVerts.length; i++) {
        p = this.point[i] = new Point3D();
        p.x = octoVerts[i][0] * this.radius;
        p.y = octoVerts[i][1] * this.radius;
        p.z = octoVerts[i][2] * this.radius;
        // p.elevation = Math.sqrt((p.x - 0.0)*(p.x - 0.0) + (p.y - 0.0)*(p.y - 0.0) + (p.z - 0.0)*(p.z - 0.0));
        p.elevation = 40-i/1.25;
    }

    for(let i = 0; i < octoFaces.length; i++) {
        let a = octoFaces[i][0],
            b = octoFaces[i][1],
            c = octoFaces[i][2];
        let elevation = (this.point[a].elevation + this.point[b].elevation + this.point[c].elevation)/3;
        this.triangle.push(new Face3D(this.point[a],this.point[b],this.point[c],elevation));
    }
    for(let i = 0; i < depth; i++) {
        let faces = [];
        for(let i = 0; i < this.triangle.length; i++) {
            faces.push(...subdivide(this.point,this.triangle[i]));
        }
        this.triangle = [...faces];
    }
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function averageElevation(a,b,c) {
    return (a.elevation + b.elevation + c.elevation) / 3;
}

function subdivide(points,tri) {
    // subdivide triangles along edges
    let a = tri.a, b = tri.b, c = tri.c, elevation = tri.elevation;
    mid_a_b = normalize(midpoint(a,b));
    mid_a_c = normalize(midpoint(a,c));
    mid_b_c = normalize(midpoint(b,c));
    points.push(mid_a_b,mid_a_c,mid_b_c);
    triangles = [
        new Face3D(a,mid_a_b,mid_a_c,averageElevation(a,mid_a_b,mid_a_c)),
        new Face3D(mid_a_b,b,mid_b_c,averageElevation(mid_a_b,b,mid_b_c)),
        new Face3D(mid_a_c,mid_b_c,c,averageElevation(mid_a_c,mid_b_c,c)),
        new Face3D(mid_a_b,mid_b_c,mid_a_c,averageElevation(mid_a_b,mid_b_c,mid_a_c))
    ];
    return triangles;
}

function rotateX(point, radians) {
    var y = point.y;
    point.y = (y * Math.cos(radians)) + (point.z * Math.sin(radians) * -1.0);
    point.z = (y * Math.sin(radians)) + (point.z * Math.cos(radians));
}

function rotateY(point, radians) {
    var x = point.x;
    point.x = (x * Math.cos(radians)) + (point.z * Math.sin(radians) * -1.0);
    point.z = (x * Math.sin(radians)) + (point.z * Math.cos(radians));
}

function rotateZ(point, radians) {
    var x = point.x;
    point.x = (x * Math.cos(radians)) + (point.y * Math.sin(radians) * -1.0);
    point.y = (x * Math.sin(radians)) + (point.y * Math.cos(radians));
}

function projection(xy, z, xyOffset, zOffset, distance) {
    return ((distance * xy) / (z - zOffset)) + xyOffset;
}

function drawTriangle(ctx, triangle) {
    let a = triangle.a, b = triangle.b, c = triangle.c;
    let p0 = [projection(a.x, a.z * modify, canvas.width / 2.0, 100.0, distance),
        projection(a.y, a.z * modify, canvas.height / 2.0, 100.0, distance)];
    let p1 = [projection(b.x, b.z * modify, canvas.width / 2.0, 100.0, distance),
        projection(b.y, b.z * modify, canvas.height / 2.0, 100.0, distance)];
    let p2 = [projection(c.x, c.z * modify, canvas.width / 2.0, 100.0, distance),
        projection(c.y, c.z * modify, canvas.height / 2.0, 100.0, distance)];

    // cull based on curve orientation
    if((p1[0]*p0[1]+p2[0]*p1[1]+p0[0]*p2[1]) < (p0[0]*p1[1]+p1[0]*p2[1]+p2[0]*p0[1])){
        // only draw faces with at least one point inside the canvas
        if((p0[0] > -cullError && p0[0] < canvas.width+cullError) && (p0[1] > -cullError && p0[1] < canvas.height+cullError)
            || (p1[0] > -cullError && p1[0] < canvas.width+cullError) && (p1[1] > -cullError && p1[1] < canvas.height+cullError)
            || (p2[0] > -cullError && p2[0] < canvas.width+cullError) && (p2[1] > -cullError && p2[1] < canvas.height+cullError)){

            if(moreDetail) {
                let canvasPoints = new Array();
                let newTriangles = subdivide(canvasPoints,triangle);
                newTriangles.forEach((item, i) => {
                    let a = item.a, b = item.b, c = item.c;
                    let p0 = [projection(a.x, a.z * modify, canvas.width / 2.0, 100.0, distance),
                        projection(a.y, a.z * modify, canvas.height / 2.0, 100.0, distance)];
                    let p1 = [projection(b.x, b.z * modify, canvas.width / 2.0, 100.0, distance),
                        projection(b.y, b.z * modify, canvas.height / 2.0, 100.0, distance)];
                    let p2 = [projection(c.x, c.z * modify, canvas.width / 2.0, 100.0, distance),
                        projection(c.y, c.z * modify, canvas.height / 2.0, 100.0, distance)];

                    ctx.beginPath();
                    ctx.moveTo(p0[0],p0[1]);
                    ctx.lineTo(p1[0],p1[1]);
                    ctx.lineTo(p2[0],p2[1]);
                    ctx.fillStyle = triangle.elevation > (40 * 0.95) ? landColor : seaColor;
                    ctx.strokeStyle = borderColor;
                    ctx.stroke();
                    ctx.fill();
                });
            } else {
                ctx.beginPath();
                ctx.moveTo(p0[0],p0[1]);
                ctx.lineTo(p1[0],p1[1]);
                ctx.lineTo(p2[0],p2[1]);
                ctx.fillStyle = triangle.elevation > (40 * 0.95) ? landColor : seaColor;
                ctx.strokeStyle = borderColor;
                ctx.stroke();
                ctx.fill();
            }
        }
    }
}

function update() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var rotateAmount = 0.01;

    for (i = 0; i < sphere.point.length; i++) {
        if (mouse.down) {
            if(mouse.y < 295) {
                rotateX(sphere.point[i], -1*rotateAmount);
            }
            if(mouse.y > 305) {
                rotateX(sphere.point[i], rotateAmount);
            }
            if(mouse.x < 395) {
                rotateY(sphere.point[i], -1*rotateAmount);
            }
            if(mouse.x > 405) {
                rotateY(sphere.point[i], rotateAmount);
            }
        }
    }
    sphere.triangle.sort((a,b) => {
        let a_verageZ = (a.a.z + a.b.z + a.c.z)/3;
        let b_verageZ = (b.a.z + b.b.z + b.c.z)/3;
        if(a_verageZ < b_verageZ) {
            return -1;
        }
        if(b_verageZ < a_verageZ) {
            return 1;
        }

        return 0;
    });
    sphere.triangle.forEach((item, i) => {
        drawTriangle(ctx,item);
    });
    ctx.restore();

    requestAnimFrame(update);
}

function start() {
    canvas.onmousemove = function (e) {
        mouse.px  = mouse.x;
        mouse.py  = mouse.y;
        var rect  = canvas.getBoundingClientRect();
        mouse.x   = e.clientX - rect.left,
        mouse.y   = e.clientY - rect.top,

        e.preventDefault();
    };

    canvas.onmouseup = function (e) {
        mouse.down = false;
        e.preventDefault();
    };

    canvas.onmousedown = function (e) {
        mouse.down = true;
        e.preventDefault();
    };

    update();
}

window.onload = function() {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    start();
};
