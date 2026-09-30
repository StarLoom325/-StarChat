// ======================================================
// LOOMCHAT V1
// HTML + CSS + JavaScript + Supabase
// ======================================================


// ======================================================
// SUPABASE CONFIG
// ======================================================

const SUPABASE_URL =
    "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
    "YOUR_SUPABASE_ANON_KEY";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;

let currentProfile = null;

let currentConversation = null;

let realtimeChannel = null;


// ======================================================
// ELEMENTS
// ======================================================

const authPage =
    document.getElementById("authPage");

const chatPage =
    document.getElementById("chatPage");

const loginBox =
    document.getElementById("loginBox");

const registerBox =
    document.getElementById("registerBox");


// ======================================================
// AUTH MODE
// ======================================================

document
    .getElementById("showRegister")
    .addEventListener("click", () => {

        loginBox.classList.add("hidden");

        registerBox.classList.remove("hidden");

    });


document
    .getElementById("showLogin")
    .addEventListener("click", () => {

        registerBox.classList.add("hidden");

        loginBox.classList.remove("hidden");

    });


// ======================================================
// REGISTER
// ======================================================

document
    .getElementById("registerButton")
    .addEventListener("click", register);


async function register() {

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();


    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim()
            .toLowerCase();


    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("registerPassword")
            .value;


    const error =
        document.getElementById("registerError");


    error.textContent = "";


    if (!name) {

        error.textContent =
            "نام نمایشی را وارد کنید.";

        return;
    }


    if (!username) {

        error.textContent =
            "نام کاربری را وارد کنید.";

        return;
    }


    if (!email) {

        error.textContent =
            "ایمیل را وارد کنید.";

        return;
    }


    if (password.length < 6) {

        error.textContent =
            "رمز عبور باید حداقل ۶ کاراکتر باشد.";

        return;
    }


    try {

        const {
            data,
            error: authError
        } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        display_name: name

                    }

                }

            });


        if (authError) {

            throw authError;

        }


        if (!data.session) {

            error.style.color =
                "#38e0ae";

            error.textContent =
                "حساب ساخته شد. ایمیل خود را تأیید کنید.";

            return;
        }


        currentUser =
            data.user;


        await createProfile(
            name,
            username
        );


        await startApplication();

    }

    catch (err) {

        error.style.color =
            "#ff7180";

        error.textContent =
            err.message;

    }

}


// ======================================================
// CREATE PROFILE
// ======================================================

async function createProfile(
    name,
    username
) {

    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .upsert({

                id: currentUser.id,

                display_name: name,

                username: username

            });


    if (error) {

        console.error(error);

    }

}


// ======================================================
// LOGIN
// ======================================================

document
    .getElementById("loginButton")
    .addEventListener("click", login);


async function login() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    const error =
        document.getElementById("loginError");


    error.textContent = "";


    try {

        const {
            data,
            error: authError
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email: email,

                    password: password

                });


        if (authError) {

            throw authError;

        }


        currentUser =
            data.user;


        await startApplication();

    }

    catch (err) {

        error.textContent =
            err.message;

    }

}


// ======================================================
// LOGOUT
// ======================================================

document
    .getElementById("logoutButton")
    .addEventListener("click", logout);


async function logout() {

    if (realtimeChannel) {

        await supabaseClient
            .removeChannel(
                realtimeChannel
            );

        realtimeChannel = null;

    }


    await supabaseClient
        .auth
        .signOut();


    currentUser = null;

    currentProfile = null;

    currentConversation = null;

    showAuthPage();

}


// ======================================================
// AUTH STATE
// ======================================================

supabaseClient
    .auth
    .onAuthStateChange(
        async (event, session) => {

            if (session) {

                currentUser =
                    session.user;

                await startApplication();

            }

            else {

                showAuthPage();

            }

        }
    );


// ======================================================
// START APPLICATION
// ======================================================

async function startApplication() {

    await loadProfile();

    showChatPage();

    await loadConversations();

}


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(error);

        return;

    }


    currentProfile =
        data;

}


// ======================================================
// SHOW PAGES
// ======================================================

function showAuthPage() {

    authPage.classList.remove(
        "hidden"
    );

    chatPage.classList.add(
        "hidden"
    );

}


function showChatPage() {

    authPage.classList.add(
        "hidden"
    );

    chatPage.classList.remove(
        "hidden"
    );

}


// ======================================================
// SEARCH USERS
// ======================================================

document
    .getElementById("searchButton")
    .addEventListener(
        "click",
        searchUsers
    );


document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                searchUsers();

            }

        }
    );


async function searchUsers() {

    const input =
        document
            .getElementById("searchInput");


    const query =
        input.value
            .trim()
            .toLowerCase();


    const results =
        document.getElementById(
            "searchResults"
        );


    results.innerHTML = "";


    if (!query) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id,username,display_name"
            )
            .neq(
                "id",
                currentUser.id
            )
            .or(
                `username.ilike.%${query}%,display_name.ilike.%${query}%`
            )
            .limit(20);


    if (error) {

        console.error(error);

        return;

    }


    if (!data.length) {

        results.innerHTML =
            `<p class="sidebar-title">
                کاربری پیدا نشد
            </p>`;

        return;

    }


    data.forEach(user => {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "search-user";


        element.innerHTML = `

            <div class="user-avatar">

                ${getInitial(
                    user.display_name
                    || user.username
                )}

            </div>

            <div class="search-user-info">

                <strong>
                    ${escapeHTML(
                        user.display_name
                        || "کاربر"
                    )}
                </strong>

                <span>
                    @${escapeHTML(
                        user.username
                        || ""
                    )}
                </span>

            </div>

        `;


        element.addEventListener(
            "click",
            () => {

                openConversation(
                    user
                );

            }
        );


        results.appendChild(
            element
        );

    });

}


// ======================================================
// OPEN CONVERSATION
// ======================================================

async function openConversation(
    otherUser
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "create_or_get_conversation",
                {
                    other_user_id:
                        otherUser.id
                }
            );


    if (error) {

        alert(error.message);

        return;

    }


    currentConversation = {

        id: data,

        otherUser:
            otherUser

    };


    document
        .getElementById(
            "searchResults"
        )
        .innerHTML = "";


    document
        .getElementById(
            "searchInput"
        )
        .value = "";


    showConversationHeader(
        otherUser
    );


    await loadMessages();

    await loadConversations();

}


// ======================================================
// HEADER
// ======================================================

function showConversationHeader(
    user
) {

    document
        .getElementById(
            "emptyChat"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "messages"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "messageForm"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "chatAvatar"
        )
        .textContent =
            getInitial(
                user.display_name
                || user.username
            );


    document
        .getElementById(
            "chatName"
        )
        .textContent =
            user.display_name
            || user.username;


    document
        .getElementById(
            "chatStatus"
        )
        .textContent =
            "@" +
            (
                user.username
                || ""
            );

}


// ======================================================
// LOAD MESSAGES
// ======================================================

async function loadMessages() {

    if (
        !currentConversation
    ) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("messages")
            .select(
                "id,sender_id,body,created_at"
            )
            .eq(
                "conversation_id",
                currentConversation.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    const messages =
        document.getElementById(
            "messages"
        );


    messages.innerHTML = "";


    data.forEach(
        message => {

            addMessage(
                message
            );

        }
    );


    scrollMessages();


    subscribeToMessages();

}


// ======================================================
// ADD MESSAGE
// ======================================================

function addMessage(
    message
) {

    const messages =
        document.getElementById(
            "messages"
        );


    const element =
        document.createElement(
            "div"
        );


    const mine =
        message.sender_id
        === currentUser.id;


    element.className =
        "message" +
        (
            mine
                ? " mine"
                : ""
        );


    const body =
        document.createElement(
            "div"
        );


    body.textContent =
        message.body;


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "message-time";


    time.textContent =
        formatTime(
            message.created_at
        );


    element.appendChild(
        body
    );


    element.appendChild(
        time
    );


    messages.appendChild(
        element
    );

}


// ======================================================
// SEND MESSAGE
// ======================================================

document
    .getElementById(
        "messageForm"
    )
    .addEventListener(
        "submit",
        sendMessage
    );


async function sendMessage(
    event
) {

    event.preventDefault();


    if (
        !currentConversation
    ) {

        return;

    }


    const input =
        document.getElementById(
            "messageInput"
        );


    const body =
        input.value.trim();


    if (!body) {

        return;

    }


    input.value = "";


    const {
        error
    } =
        await supabaseClient
            .from("messages")
            .insert({

                conversation_id:
                    currentConversation.id,

                sender_id:
                    currentUser.id,

                body: body

            });


    if (error) {

        console.error(error);

        input.value = body;

        alert(
            "ارسال پیام انجام نشد."
        );

        return;

    }


    scrollMessages();

}


// ======================================================
// REALTIME
// ======================================================

function subscribeToMessages() {

    if (realtimeChannel) {

        supabaseClient
            .removeChannel(
                realtimeChannel
            );

    }


    realtimeChannel =
        supabaseClient
            .channel(
                "conversation-" +
                currentConversation.id
            )


            .on(

                "postgres_changes",

                {

                    event: "INSERT",

                    schema: "public",

                    table: "messages",

                    filter:
                        "conversation_id=eq." +
                        currentConversation.id

                },

                payload => {

                    const exists =
                        document.querySelector(
                            `[data-message-id="${payload.new.id}"]`
                        );


                    if (!exists) {

                        addMessage(
                            payload.new
                        );

                        scrollMessages();

                    }

                }

            )


            .subscribe();

}


// ======================================================
// LOAD CONVERSATIONS
// ======================================================

async function loadConversations() {

    const list =
        document.getElementById(
            "conversationList"
        );


    list.innerHTML = "";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("conversations")
            .select(
                "id,user_a,user_b,updated_at"
            )
            .or(
                `user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    if (!data.length) {

        list.innerHTML =
            `<p class="sidebar-title">
                هنوز گفتگویی ندارید.
            </p>`;

        return;

    }


    const otherIds =
        data.map(
            conversation => {

                return conversation.user_a
                    === currentUser.id

                    ? conversation.user_b

                    : conversation.user_a;

            }
        );


    const {
        data: users
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id,username,display_name"
            )
            .in(
                "id",
                otherIds
            );


    const userMap =
        {};


    users.forEach(
        user => {

            userMap[user.id] =
                user;

        }
    );


    data.forEach(
        conversation => {

            const otherId =
                conversation.user_a
                === currentUser.id

                    ? conversation.user_b

                    : conversation.user_a;


            const user =
                userMap[otherId];


            if (!user) {

                return;

            }


            createConversationItem(
                conversation,
                user
            );

        }
    );

}


// ======================================================
// CONVERSATION ITEM
// ======================================================

function createConversationItem(
    conversation,
    user
) {

    const list =
        document.getElementById(
            "conversationList"
        );


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "conversation-item";


    element.innerHTML = `

        <div class="user-avatar">

            ${getInitial(
                user.display_name
                || user.username
            )}

        </div>


        <div class="conversation-info">

            <strong>
                ${escapeHTML(
                    user.display_name
                    || "کاربر"
                )}
            </strong>

            <span>
                @${escapeHTML(
                    user.username
                    || ""
                )}
            </span>

        </div>

    `;


    element.addEventListener(
        "click",
        async () => {

            currentConversation = {

                id:
                    conversation.id,

                otherUser:
                    user

            };


            showConversationHeader(
                user
            );


            await loadMessages();

        }
    );


    list.appendChild(
        element
    );

}


// ======================================================
// PROFILE
// ======================================================

document
    .getElementById(
        "profileButton"
    )
    .addEventListener(
        "click",
        openProfile
    );


async function openProfile() {

    if (!currentProfile) {

        await loadProfile();

    }


    document
        .getElementById(
            "profileName"
        )
        .value =
            currentProfile
                ?.display_name
            || "";


    document
        .getElementById(
            "profileUsername"
        )
        .value =
            currentProfile
                ?.username
            || "";


    document
        .getElementById(
            "profileModal"
        )
        .classList.remove(
            "hidden"
        );

}


// ======================================================
// CLOSE PROFILE
// ======================================================

document
    .getElementById(
        "closeProfile"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "profileModal"
                )
                .classList.add(
                    "hidden"
                );

        }
    );


// ======================================================
// SAVE PROFILE
// ======================================================

document
    .getElementById(
        "saveProfile"
    )
    .addEventListener(
        "click",
        saveProfile
    );


async function saveProfile() {

    const name =
        document
            .getElementById(
                "profileName"
            )
            .value
            .trim();


    const username =
        document
            .getElementById(
                "profileUsername"
            )
            .value
            .trim()
            .toLowerCase();


    const message =
        document.getElementById(
            "profileMessage"
        );


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({

                display_name:
                    name,

                username:
                    username

            })
            .eq(
                "id",
                currentUser.id
            );


    if (error) {

        message.style.color =
            "#ff7180";

        message.textContent =
            error.message;

        return;

    }


    currentProfile.display_name =
        name;


    currentProfile.username =
        username;


    message.style.color =
        "#38e0ae";


    message.textContent =
        "پروفایل ذخیره شد.";

}


// ======================================================
// MOBILE BACK
// ======================================================

document
    .getElementById(
        "mobileBack"
    )
    .addEventListener(
        "click",
        () => {

            currentConversation =
                null;

            document
                .getElementById(
                    "messages"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "messageForm"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "emptyChat"
                )
                .classList.remove(
                    "hidden"
                );

        }
    );


// ======================================================
// HELPERS
// ======================================================

function getInitial(
    text
) {

    if (!text) {

        return "?";

    }


    return text
        .trim()
        .charAt(0)
        .toUpperCase();

}


function formatTime(
    date
) {

    return new Date(
        date
    ).toLocaleTimeString(
        "fa-IR",
        {

            hour: "2-digit",

            minute: "2-digit"

        }
    );

}


function scrollMessages() {

    const messages =
        document.getElementById(
            "messages"
        );


    messages.scrollTop =
        messages.scrollHeight;

}


function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ======================================================
// INITIAL SESSION
// ======================================================

async function initialize() {

    const {
        data
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        data.session
    ) {

        currentUser =
            data.session.user;

        await startApplication();

    }

}


initialize();