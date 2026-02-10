
import jwt from 'jsonwebtoken';

const s: number = 15 * 60 * 1000;

const options: jwt.SignOptions = {
    expiresIn: s
};

const secret = 'secret';
jwt.sign({ foo: 'bar' }, secret, options);
