FROM node:16-alpine

WORKDIR /root

RUN npx create-react-app frontend

WORKDIR frontend

RUN npm install -g npm@9.4.0 \
    && npm install core-js \
    && npm install react-color\
    && npm install @uiw/react-color \
    && npm install axios socket.io-client \
    && npm install react-select \
    && npm install react-tabs \
    && npm install react-modal \
    && npm install react-icons \
    && npm install react-scroll-to-bottom \
    && npm install react-router-dom \
    && npm install react-perfect-scrollbar \
    && npm install moment \
    && npm install react-dropdown \
    && npm install react-bootstrap \
    && npm install react-avatar \
    && npm install react-native-canvas \
    && npm install gapi-script \
    && npm install @react-oauth/google@latest \
    && npm install mui-one-time-password-input \
    && npm install react-cookie \
    && npm install otp-input-react \
    && npm install @mui/material \
    && npm install @emotion/styled
# && rm public/* 
# && rm package.json \

RUN rm public/*
RUN rm package.json

COPY ./ .
# COPY public/* .
# COPY ./package.json .

EXPOSE 3000

CMD npm start
