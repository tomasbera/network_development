const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')
const fWriter = require('fs/promises')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors({origin: "http://localhost:8080"}))

const server = app.listen(1234, () => {
    console.log(`Listening to port ${server.address().port}`);
});

app.post('/compiler', async (request, response) => {
    const { code } = request.body;

    try {
        await writeCode(code);
        await execCommand("docker build \"./cpp/\" -t cpp_compiler");
        const output = await execCommand("docker run --rm cpp_compiler")
            .then(execCommand("docker rmi cpp_compiler"));
        response.status(200).json({ result: output });
    } catch (error) {
        response.status(500).json({ error: error });
    }
});

async function writeCode(code, result) {
    try {
        await fWriter.writeFile('cpp/main.cpp', code);
    } catch (err) {
        result.status(409).send(JSON.stringify({error: err}))
    }
}

async function execCommand(command) {
    return new Promise((res, reject) => {
        const { exec } = require("child_process");
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                reject(stderr);
            } else {
                console.log(stdout);
                res(stdout);
            }
        });
    });
}
