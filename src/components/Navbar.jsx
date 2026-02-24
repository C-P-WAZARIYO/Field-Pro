import "../styles/Navbar.css";

function Navbar() {
    return (
        <nav className="Navbar">
            <ul>
                <li><a href="/content">Content</a></li>
                <li><a href="/email">Email</a></li>
                <li><a href="/employee">Employee</a></li>
                <li><a href="/manager">Manager</a></li>
                <li><a href="/profile">Profile</a></li>
                <li><a href="/supervisor">Supervisor</a></li>
                <li><a href="/task">Task</a></li>
                <li><a href="/user">User</a></li>
                <li><a href="/videocall">Videocall</a></li>
                <li><a href="/voicecall">Voicecall</a></li>
                <li><a href="/chat">Chat</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/allocate">Allocate</a></li>
                <li><a href="/admin">Admin</a></li>
                <li><a href="/analytic">Analytic</a></li>
                <li><a href="/Auth">Auth</a></li>
                <li><a href="/">Home</a></li>
            </ul>
        </nav>
    );
}

export default Navbar;