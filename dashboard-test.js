

document
  .getElementById("loginForm")
  .addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      const error =
        document.getElementById(
          "error"
        );

      error.style.display =
        "none";

      const username =
        document
          .getElementById(
            "username"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "password"
          )
          .value;

      try {

        const response =
          await fetch(
            "/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              credentials:
                "same-origin",

              body:
                JSON.stringify({
                  username,
                  password
                })
            }
          );

        const data =
          await response.json();

        if (data.success) {

          window.location.href =
            "/dashboard";

          return;
        }

        error.textContent =
          "âŒ " +
          (
            data.message ||
            "Identifiants incorrects."
          );

        error.style.display =
          "block";

      } catch (err) {

        error.textContent =
          "âŒ Serveur non disponible.";

        error.style.display =
          "block";

      }

    }
  );


