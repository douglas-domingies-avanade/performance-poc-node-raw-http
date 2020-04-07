import { createServer } from 'http';

const { PORT = 8004 } = process.env;

const server = createServer((req, res) => {
    res.write('OK', (err) => {
        if (err)
            console.log('write failed');
        else console.log('write ok');
    });
    res.end(() => {
        //console.log(req.method, req.url);
    });
});
server.listen(PORT, () => {
    console.log('We are live on port', PORT);
});

// import CustomServer from "./server";

// const app = new CustomServer(PORT, { verbose: true });
// app.get('*', (req, res)=>{
//     console.log('yay!');
//     res.send('OK');
// })
// app.listen();