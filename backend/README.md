

\# PantrySync Backend



This is the initial Node.js backend for PantrySync, developed by Team Buns.



\## Technologies

\- Node.js

\- Express.js

\- MySQL (planned integration)



\## Current Features

\- Basic Express server

\- GET endpoint to view ingredients

\- POST endpoint to add ingredients

\- Basic ingredient validation

\- Sample bakery inventory data



\## Running the Backend



1\. Install Node.js.

2\. Open a terminal in the backend folder.

3\. Run `npm install`.

4\. Run `node server.js`.

5\. Visit http://localhost:3000/ingredients



\## API Endpoints



GET / - Check if the backend is running.



GET /ingredients - View all ingredients.



POST /ingredients - Add a new ingredient.



Example POST request body:



{

&#x20; "name": "Butter",

&#x20; "quantity": 15,

&#x20; "unit": "lbs"

}



\## Future Development



The backend currently uses temporary sample data. Future updates will connect it to the MySQL database, add user authentication, and integrate the React frontend.



