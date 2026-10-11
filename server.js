// Lab05 — Хичээлд бүртгүүлэх API (Лекц 5-ын жишээ систем)
// Ажиллуулах: node server.js   (ямар ч сан суулгах шаардлагагүй)
const http = require('http'); // node.js http санг оруулж ирэх

// In-memory "өгөгдлийн сан"
// Жинхэнэ өгөгдлийн сан үүсгэхийн оронд кодон доторх хувсагчид мэдээллийг түр хадгалж байна.
const students = {};      // id -> { status, coursesTaken }
const courses = {};       // id -> { prerequisites }
const registrations = []; // { registrationID, studentID, courseID }
// Хэрэглэгчид хариу бичиж илгээх функц
function send(res, status, obj) {
// 
  res.writeHead(status, { 'Content-Type': 'application/json' }); // буцах мэдээлэл JSON форматтай гэсэн үг 

  res.end(JSON.stringify(obj)); // JS object JSON текст болгон буцаана.
}

// Сервер үүсгэх ба хүсэлт боловсруулах, хүсэлт илгээх бүрд энэ доторх код ажилладаг. 
const server = http.createServer((req, res) => {

// 1. Хүсэлтийн бие буюу ирсэн текстийг цуглуулах 
  let body = '';
  req.on('data', (c) => (body += c)); // Өгөгдлийг ирэх бүрд цуглуулна
  req.on('end', () => { // Өгөгдөл ирж дуусахад
    let data = {};
    try { data = body ? JSON.parse(body) : {}; } // Ирсэн json текстийг цуглуулж аваад кодонд ашилах боломжтой object болгон хувиргана.
    catch { return send(res, 400, { result: 'ERROR_BAD_JSON' }); }

// 2. Зам тодорхойлох ба өгөгдөл бэтлгэх 
// URL-аас асуултын тэмдэг задарсан хэсгийг цэвэрлэнэ.
    const url = req.url.split('?')[0]; // url = '/students/B231234567'

    // Setup endpoints — тестийн Initialization-д ашиглана
    let m;
// PUT /students/S101 -> Оюутан үүсгэх
// m[1]= b231234567 && m[0]= /students/b23123456
    if (req.method === 'PUT' && (m = url.match(/^\/students\/([\w-]+)$/))) { 

//students['b23123456']
      students[m[1]] = {
        status: data.status || 'active',
        coursesTaken: data.coursesTaken || [],
      };
      return send(res, 200, { result: 'OK' });
    }
// PUT /courses/CS101 -> Хичээл үүсгэх

    if (req.method === 'PUT' && (m = url.match(/^\/courses\/([\w-]+)$/))) {
      courses[m[1]] = { prerequisites: data.prerequisites || [] };
      return send(res, 200, { result: 'OK' });
    }

// GET /courses/CS101 -> Хичээлийн мэдээлэл харах

    if (req.method === 'GET' && (m = url.match(/^\/courses\/([\w-]+)$/))) {
      const c = courses[m[1]];
      if (!c) return send(res, 404, { result: 'ERROR_NO_COURSE' });
      return send(res, 200, { courseID: m[1], ...c });
    }

    // Тестлэгдэх гол функц — хичээлд бүртгүүлэх
    // 201 = амжилттай, 200 + ERROR_* = оролтын алдаа (Лекц 5-ын семантик)


    if (req.method === 'POST' && url === '/registrations') {
      const { studentID, courseID } = data;
      if (!studentID || !courseID)
        return send(res, 400, { result: 'ERROR_BAD_REQUEST' });


      const student = students[studentID];
      if (!student) return send(res, 200, { result: 'ERROR_NO_STUDENT' });
      if (student.status !== 'active')
        return send(res, 200, { result: 'ERROR_INACTIVE_STUDENT' });

      const course = courses[courseID];
      if (!course) return send(res, 200, { result: 'ERROR_NO_COURSE' });

      const missing = course.prerequisites.filter(
        (p) => !student.coursesTaken.includes(p)
      );
      if (missing.length > 0)
        return send(res, 200, { result: 'ERROR_PREREQUISITES', missing });

      const registrationID = registrations.length + 1;
      registrations.push({ registrationID, studentID, courseID });
      return send(res, 201, { result: 'OK', registrationID });
    }


    if (req.method === 'GET' && url === '/registrations')
      return send(res, 200, registrations);

    send(res, 404, { result: 'ERROR_NOT_FOUND' });
  });
});

server.listen(3000, () => console.log('Бүртгэлийн API: http://localhost:3000'));
