function showSignup() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("signupBox").classList.remove("hidden");
    clearMessage();
}

function showLogin() {
    document.getElementById("signupBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
    clearMessage();
}

function clearMessage() {
    const msg = document.getElementById("msg");
    msg.innerText = "";
    msg.className = "";
}

function displayMessage(text, isError = false) {
    const msg = document.getElementById("msg");
    msg.innerText = text;
    if (isError) {
        msg.className = "error";
    } else {
        msg.className = "success";
    }
}

// SIGNUP
function signup() {
    let email = document.getElementById("newEmail").value.trim();
    let password = document.getElementById("newPassword").value;

    if (!email || !password) {
        displayMessage("Please enter email & password", true);
        return;
    }

    displayMessage("Creating account...");

    fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok) {
            displayMessage(data.message || "Account created! Now login.");
            // Automatically switch back to login and populate fields
            setTimeout(() => {
                showLogin();
                document.getElementById("email").value = email;
            }, 1500);
        } else {
            displayMessage(data.error || "Signup failed", true);
        }
    })
    .catch(error => {
        displayMessage("Network error. Try again.", true);
        console.error("Signup error:", error);
    });
}

// LOGIN
function login() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value;

    if (!email || !password) {
        displayMessage("Please enter email & password", true);
        return;
    }

    displayMessage("Logging in...");

    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("currentUser", email);
            displayMessage("Login successful! Redirecting...");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 800);
        } else {
            displayMessage(data.error || "Login failed", true);
        }
    })
    .catch(error => {
        displayMessage("Network error. Try again.", true);
        console.error("Login error:", error);
    });
}

// Check if running directly from file system
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.protocol === 'file:') {
        const banner = document.createElement("div");
        banner.style.position = "fixed";
        banner.style.top = "0";
        banner.style.left = "0";
        banner.style.width = "100%";
        banner.style.background = "#ff2d55";
        banner.style.color = "white";
        banner.style.textAlign = "center";
        banner.style.padding = "12px";
        banner.style.zIndex = "999999";
        banner.style.fontWeight = "700";
        banner.style.fontSize = "14px";
        banner.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
        banner.innerHTML = '⚠️ Running from local files. To connect to the backend, please open: <a href="http://127.0.0.1:5000/" style="color:white; text-decoration:underline; font-weight:900;" target="_blank">http://127.0.0.1:5000/</a>';
        document.body.prepend(banner);
        
        // Push login box down slightly to not overlap banner
        const loginCenter = document.querySelector(".login-center");
        if (loginCenter) loginCenter.style.paddingTop = "60px";
    }
});