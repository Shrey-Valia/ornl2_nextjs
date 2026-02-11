"""
Tests for the FastAPI PCINN backend (docker/web.py)

Covers:
  - DomainModel architecture (layer shapes, output activation ranges)
  - normalize_input logic
  - /health endpoint
  - / root endpoint
  - /predict endpoint — valid inputs, edge cases, validation warnings
  - /predict output structure (conversion, molecular weights, PDI)
  - Dockerfile and docker-compose.yml structural validation

Run with:
    cd docker && python -m pytest test_web.py -v
"""

import math
import os
import sys
import pytest
import numpy as np
import torch

# ---------------------------------------------------------------------------
# Ensure the docker/ directory is importable
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(__file__))

# We import selectively to avoid triggering model loading at import time
# in test environments where the .pt file may not exist
from web import DomainModel, normalize_input, PredictionRequest


# ===========================================================================
# DomainModel Architecture Tests
# ===========================================================================

class TestDomainModel:
    """Tests for the PCINN neural network architecture."""

    def setup_method(self):
        self.model = DomainModel()
        self.model.eval()

    def test_model_accepts_5_inputs(self):
        """Model takes [M, S, I, temp, time] — 5 features."""
        x = torch.randn(1, 5)
        x_out, m_out = self.model(x)
        assert x_out.shape == (1, 1), f"Expected (1,1) conversion output, got {x_out.shape}"
        assert m_out.shape == (1, 5), f"Expected (1,5) MW output, got {m_out.shape}"

    def test_batch_inference(self):
        """Model supports batch inputs."""
        batch_size = 8
        x = torch.randn(batch_size, 5)
        x_out, m_out = self.model(x)
        assert x_out.shape == (batch_size, 1)
        assert m_out.shape == (batch_size, 5)

    def test_conversion_output_between_0_and_1(self):
        """Sigmoid activation constrains conversion to (0, 1)."""
        x = torch.randn(100, 5) * 10  # wide range
        x_out, _ = self.model(x)
        assert (x_out >= 0).all(), "Conversion has negative values"
        assert (x_out <= 1).all(), "Conversion exceeds 1"

    def test_mw_output_non_negative(self):
        """Softplus activation ensures MW outputs are >= 0."""
        x = torch.randn(100, 5) * 10
        _, m_out = self.model(x)
        assert (m_out >= 0).all(), "MW outputs have negative values"

    def test_deterministic_in_eval(self):
        """Same input gives same output in eval mode."""
        x = torch.tensor([[0.2, 1.0, 0.5, 300.0, 60.0]])
        with torch.no_grad():
            out1 = self.model(x)
            out2 = self.model(x)
        assert torch.allclose(out1[0], out2[0])
        assert torch.allclose(out1[1], out2[1])

    def test_layer_sizes(self):
        """Verify network architecture matches specification."""
        assert self.model.fc1.in_features == 5
        assert self.model.fc1.out_features == 128
        assert self.model.fc2.in_features == 128
        assert self.model.fc2.out_features == 128
        assert self.model.fc3.in_features == 128
        assert self.model.fc3.out_features == 64
        assert self.model.Xout.in_features == 64
        assert self.model.Xout.out_features == 1
        assert self.model.Mout.in_features == 64
        assert self.model.Mout.out_features == 5


# ===========================================================================
# Normalization Tests
# ===========================================================================

class TestNormalizeInput:
    """Tests for the input normalization function."""

    def test_normalize_with_scalers(self):
        """When scalers are loaded, output should be in [0, 1] range."""
        import web as web_module

        # Temporarily override scaler globals
        original_loaded = web_module.scalers_loaded
        original_max = web_module.scalerx_max
        original_min = web_module.scalerx_min

        try:
            web_module.scalers_loaded = True
            web_module.scalerx_max = np.array([10.0, 10.0, 10.0, 500.0, 3600.0])
            web_module.scalerx_min = np.array([0.0, 0.0, 0.0, 273.0, 0.0])

            raw = np.array([[5.0, 5.0, 5.0, 386.5, 1800.0]])
            normalized = normalize_input(raw)

            # Should be approximately 0.5 for each feature
            np.testing.assert_allclose(normalized, 0.5, atol=0.01)
        finally:
            web_module.scalers_loaded = original_loaded
            web_module.scalerx_max = original_max
            web_module.scalerx_min = original_min

    def test_normalize_without_scalers_returns_raw(self):
        """When scalers are not loaded, raw input is returned unchanged."""
        import web as web_module

        original_loaded = web_module.scalers_loaded
        try:
            web_module.scalers_loaded = False
            raw = np.array([[1.0, 2.0, 3.0, 4.0, 5.0]])
            result = normalize_input(raw)
            np.testing.assert_array_equal(result, raw)
        finally:
            web_module.scalers_loaded = original_loaded

    def test_normalize_min_maps_to_zero(self):
        """Minimum scaler values should map to 0."""
        import web as web_module

        original_loaded = web_module.scalers_loaded
        original_max = web_module.scalerx_max
        original_min = web_module.scalerx_min

        try:
            web_module.scalers_loaded = True
            web_module.scalerx_min = np.array([0.0, 0.0, 0.0, 273.0, 0.0])
            web_module.scalerx_max = np.array([10.0, 10.0, 10.0, 500.0, 3600.0])

            raw = np.array([[0.0, 0.0, 0.0, 273.0, 0.0]])
            normalized = normalize_input(raw)
            np.testing.assert_allclose(normalized, 0.0, atol=1e-6)
        finally:
            web_module.scalers_loaded = original_loaded
            web_module.scalerx_max = original_max
            web_module.scalerx_min = original_min

    def test_normalize_max_maps_to_one(self):
        """Maximum scaler values should map to ~1."""
        import web as web_module

        original_loaded = web_module.scalers_loaded
        original_max = web_module.scalerx_max
        original_min = web_module.scalerx_min

        try:
            web_module.scalers_loaded = True
            web_module.scalerx_min = np.array([0.0, 0.0, 0.0, 273.0, 0.0])
            web_module.scalerx_max = np.array([10.0, 10.0, 10.0, 500.0, 3600.0])

            raw = np.array([[10.0, 10.0, 10.0, 500.0, 3600.0]])
            normalized = normalize_input(raw)
            np.testing.assert_allclose(normalized, 1.0, atol=1e-6)
        finally:
            web_module.scalers_loaded = original_loaded
            web_module.scalerx_max = original_max
            web_module.scalerx_min = original_min


# ===========================================================================
# PredictionRequest Validation Tests
# ===========================================================================

class TestPredictionRequest:
    """Tests for the Pydantic request schema."""

    def test_valid_request(self):
        req = PredictionRequest(M=0.2, S=1.0, I=0.5, temp=300, time=60, Reaction=3)
        assert req.M == 0.2
        assert req.S == 1.0
        assert req.I == 0.5
        assert req.temp == 300
        assert req.time == 60
        assert req.Reaction == 3

    def test_request_type_coercion(self):
        """Pydantic coerces compatible types."""
        req = PredictionRequest(M=1, S=2, I=3, temp=300, time=60, Reaction=1)
        assert isinstance(req.M, float)

    def test_missing_field_raises(self):
        """Missing required fields should raise ValidationError."""
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PredictionRequest(M=0.2, S=1.0)  # missing I, temp, time, Reaction


# ===========================================================================
# Prediction Logic Tests (unit-level, no server)
# ===========================================================================

class TestPredictionLogic:
    """Test the core prediction computation from the /predict endpoint."""

    def test_molecular_weight_conversion_from_log10(self):
        """MW values should be 10^(model_output) when converted from log10 scale."""
        m_output = [4.7, 5.0, 5.18, 5.3, 5.08]
        mw = {
            "Mn": 10 ** m_output[0],
            "Mw": 10 ** m_output[1],
            "Mz": 10 ** m_output[2],
            "Mz_plus1": 10 ** m_output[3],
            "Mv": 10 ** m_output[4],
        }
        assert abs(mw["Mn"] - 50118.72) < 1.0
        assert abs(mw["Mw"] - 100000.0) < 1.0
        assert abs(mw["Mz"] - 151356.12) < 1.0

    def test_pdi_calculation(self):
        """PDI = Mw / Mn."""
        m_output = [4.7, 5.0, 5.18, 5.3, 5.08]
        Mn = 10 ** m_output[0]
        Mw = 10 ** m_output[1]
        PDI = Mw / Mn
        expected_pdi = 10 ** (5.0 - 4.7)
        assert abs(PDI - expected_pdi) < 0.001

    def test_conversion_scalar_extraction(self):
        """Conversion should be extracted correctly from model output."""
        # Simulating what the predict endpoint does
        x_output_list = [0.85]
        conversion = float(x_output_list[0]) if isinstance(x_output_list[0], (int, float)) else float(x_output_list[0])
        assert conversion == 0.85

        # When it's a nested list
        x_output_nested = [[0.73]]
        val = x_output_nested[0]
        conversion2 = float(val) if isinstance(val, (int, float)) else float(val[0])
        assert conversion2 == 0.73


# ===========================================================================
# Input Validation Logic Tests
# ===========================================================================

class TestInputValidation:
    """Test the validation/warning logic in the /predict endpoint."""

    def test_negative_concentrations_warning(self):
        """Negative M, S, or I should produce a warning."""
        warnings = []
        M, S, I = -1.0, 1.0, 0.5
        if M < 0 or S < 0 or I < 0:
            warnings.append("Negative concentrations detected - results may be invalid")
        assert len(warnings) == 1
        assert "Negative" in warnings[0]

    def test_temperature_out_of_range_low(self):
        """Temperature below 273K should produce a warning."""
        warnings = []
        temp = 200
        if temp < 273 or temp > 500:
            warnings.append(f"Temperature {temp}K outside typical range (273-500K)")
        assert len(warnings) == 1

    def test_temperature_out_of_range_high(self):
        """Temperature above 500K should produce a warning."""
        warnings = []
        temp = 600
        if temp < 273 or temp > 500:
            warnings.append(f"Temperature {temp}K outside typical range (273-500K)")
        assert len(warnings) == 1

    def test_temperature_in_range_no_warning(self):
        """Temperature within 273-500K should not produce a warning."""
        warnings = []
        temp = 350
        if temp < 273 or temp > 500:
            warnings.append(f"Temperature {temp}K outside typical range (273-500K)")
        assert len(warnings) == 0

    def test_negative_time_warning(self):
        """Negative time should produce a warning."""
        warnings = []
        time = -10
        if time < 0:
            warnings.append("Negative time is not physical")
        assert len(warnings) == 1

    def test_valid_inputs_no_warnings(self):
        """Valid inputs should produce no warnings."""
        warnings = []
        M, S, I, temp, time_val = 0.2, 1.0, 0.5, 300, 60
        if M < 0 or S < 0 or I < 0:
            warnings.append("Negative concentrations")
        if temp < 273 or temp > 500:
            warnings.append("Temperature out of range")
        if time_val < 0:
            warnings.append("Negative time")
        assert len(warnings) == 0


# ===========================================================================
# Dockerfile Structural Tests
# ===========================================================================

class TestDockerfiles:
    """Validate Dockerfile and docker-compose.yml structure."""

    @pytest.fixture
    def docker_dir(self):
        return os.path.dirname(__file__)

    @pytest.fixture
    def project_root(self):
        return os.path.dirname(os.path.dirname(__file__))

    def test_dockerfile_exists(self, docker_dir):
        assert os.path.isfile(os.path.join(docker_dir, 'Dockerfile'))

    def test_dockerfile_exposes_port_8000(self, docker_dir):
        with open(os.path.join(docker_dir, 'Dockerfile')) as f:
            content = f.read()
        assert 'EXPOSE 8000' in content

    def test_dockerfile_runs_uvicorn(self, docker_dir):
        with open(os.path.join(docker_dir, 'Dockerfile')) as f:
            content = f.read()
        assert 'uvicorn' in content
        assert 'web:app' in content

    def test_dockerfile_has_healthcheck(self, docker_dir):
        with open(os.path.join(docker_dir, 'Dockerfile')) as f:
            content = f.read()
        assert 'HEALTHCHECK' in content
        assert '/health' in content

    def test_dockerfile_copies_requirements_first(self, docker_dir):
        """Requirements should be copied before app code for Docker cache efficiency."""
        with open(os.path.join(docker_dir, 'Dockerfile')) as f:
            content = f.read()
        req_pos = content.find('COPY requirements.txt')
        app_pos = content.find('COPY . .')
        assert req_pos < app_pos, "requirements.txt should be copied before app code"

    def test_requirements_txt_has_core_deps(self, docker_dir):
        with open(os.path.join(docker_dir, 'requirements.txt')) as f:
            content = f.read()
        assert 'fastapi' in content
        assert 'uvicorn' in content
        assert 'torch' in content
        assert 'numpy' in content
        assert 'pydantic' in content

    def test_docker_compose_exists(self, project_root):
        assert os.path.isfile(os.path.join(project_root, 'docker-compose.yml'))

    def test_docker_compose_defines_backend_service(self, project_root):
        with open(os.path.join(project_root, 'docker-compose.yml')) as f:
            content = f.read()
        assert 'pcinn-backend' in content

    def test_docker_compose_maps_port_8000(self, project_root):
        with open(os.path.join(project_root, 'docker-compose.yml')) as f:
            content = f.read()
        assert '8000:8000' in content

    def test_docker_compose_has_web_service(self, project_root):
        with open(os.path.join(project_root, 'docker-compose.yml')) as f:
            content = f.read()
        assert 'web:' in content

    def test_docker_compose_web_depends_on_backend(self, project_root):
        with open(os.path.join(project_root, 'docker-compose.yml')) as f:
            content = f.read()
        assert 'depends_on' in content
        assert 'pcinn-backend' in content

    def test_docker_compose_sets_fastapi_url(self, project_root):
        with open(os.path.join(project_root, 'docker-compose.yml')) as f:
            content = f.read()
        assert 'FASTAPI_URL' in content

    def test_model_file_exists(self, docker_dir):
        """The trained model weights file must be present."""
        assert os.path.isfile(os.path.join(docker_dir, 'MMA_solution_net.pt'))

    def test_scaler_files_exist(self, docker_dir):
        """Scaler files are needed for accurate predictions."""
        assert os.path.isfile(os.path.join(docker_dir, 'scalerx_max.npy'))
        assert os.path.isfile(os.path.join(docker_dir, 'scalerx_min.npy'))


# ===========================================================================
# FastAPI Endpoint Tests (using TestClient)
# ===========================================================================

class TestFastAPIEndpoints:
    """Integration tests for the FastAPI app using TestClient."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from web import app
        return TestClient(app)

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "MMA PCINN Model API" in data["message"]
        assert data["version"] == "2.0.0"

    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True

    def test_predict_valid_input(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": 60,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "conversion" in data
        assert "molecular_weights" in data
        assert "x_output" in data
        assert "m_output" in data
        assert len(data["m_output"]) == 5

    def test_predict_output_ranges(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": 60,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        data = response.json()

        # Conversion is between 0 and 1 (sigmoid)
        assert 0 <= data["conversion"] <= 1

        # MW values should be positive
        mw = data["molecular_weights"]
        assert mw["Mn"] > 0
        assert mw["Mw"] > 0
        assert mw["Mz"] > 0
        assert mw["Mv"] > 0
        assert mw["PDI"] > 0

    def test_predict_pdi_equals_mw_over_mn(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 350,
            "time": 120,
            "Reaction": 1,
        }
        response = client.post("/predict", json=payload)
        data = response.json()
        mw = data["molecular_weights"]
        expected_pdi = mw["Mw"] / mw["Mn"]
        assert abs(mw["PDI"] - expected_pdi) < 0.001

    def test_predict_negative_concentration_warning(self, client):
        payload = {
            "M": -1.0,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": 60,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        data = response.json()
        assert any("Negative" in w for w in data["warnings"])

    def test_predict_extreme_temperature_warning(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 100,
            "time": 60,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        data = response.json()
        assert any("Temperature" in w for w in data["warnings"])

    def test_predict_negative_time_warning(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": -10,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        data = response.json()
        assert any("time" in w.lower() for w in data["warnings"])

    def test_predict_returns_input_echo(self, client):
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": 60,
            "Reaction": 3,
        }
        response = client.post("/predict", json=payload)
        data = response.json()
        assert data["input"]["M"] == 0.2
        assert data["input"]["S"] == 1.0
        assert data["input"]["Reaction"] == 3

    def test_predict_missing_field(self, client):
        """Missing required fields should return 422."""
        payload = {"M": 0.2, "S": 1.0}  # missing I, temp, time, Reaction
        response = client.post("/predict", json=payload)
        assert response.status_code == 422

    def test_debug_endpoint(self, client):
        payload = {"test": "data"}
        response = client.post("/debug", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["received"] == payload

    def test_predict_deterministic(self, client):
        """Same input should produce same output."""
        payload = {
            "M": 0.2,
            "S": 1.0,
            "I": 0.5,
            "temp": 300,
            "time": 60,
            "Reaction": 3,
        }
        r1 = client.post("/predict", json=payload).json()
        r2 = client.post("/predict", json=payload).json()

        assert r1["conversion"] == r2["conversion"]
        assert r1["m_output"] == r2["m_output"]
        assert r1["molecular_weights"] == r2["molecular_weights"]
