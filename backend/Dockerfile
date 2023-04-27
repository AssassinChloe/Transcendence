FROM node:16-alpine
# use latest stable alpine version?

WORKDIR /root

COPY package*.json ./

RUN npm install -g npm@9.4.0 \
    && npm install -g @nestjs/cli \
    && npm install @nestjs/config \
    && npm install @nestjs/common \
    && npm install --save @nestjs/typeorm \
    && npm install @nestjs/websockets \
    && npm install socket.io \
    && npm install class-validator --save \
    && npm install class-transformer \
    && npm install jsonwebtoken \
    && npm install bcrypt \
    && npm install pg \
    && npm install express \
    && npm install @nestjs/platform-socket.io \
    && npm install @nestjs/testing \
    && npm install @nestjs/passport \
    && npm install nodemailer \
    && npm install @nestjs/jwt \
    && npm install @nestjs-modules/mailer \
    && npm install hbs \
    && npm install qrcode \
    && npm install passport-42 \
    && npm install axios \
    && npm install @types/express \
    && npm install @nestjs/swagger \
    && npm install --save-dev @types/node \
    && npm install passport-jwt \
    && npm install uuid \
    && npm install otplib


RUN nest new backend

EXPOSE 7001
EXPOSE 5001

WORKDIR /root/backend
COPY ./ .

# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD npm run start